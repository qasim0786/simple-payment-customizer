import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  Banner,
  Spinner,
  Icon,
  List,
  Badge
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import { PlusCircleIcon } from "@shopify/polaris-icons";

export default function PaymentCustomizationPage() {
  const [methods, setMethods] = useState<{ id: string; name: string; priority: number }[]>([]);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [statusRes, methodsRes] = await Promise.all([
          fetch("app/api/activation_status"),
          fetch("/api/check-payment-methods")
        ]);

        const statusData = await statusRes.json();
        const methodsData = await methodsRes.json();

        setIsActive(statusData.isActive);

        if (methodsData?.methods?.length > 0) {
          setMethods(
            methodsData.methods.map((m: any, i: number) => ({
              id: Date.now().toString() + i,
              name: m.name,
              priority: m.priority
            }))
          );
        } else {
          setMethods([{ id: Date.now().toString(), name: "", priority: 1 }]);
        }
      } catch (err) {
        setIsActive(false);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const priorities = methods.map((m) => m.priority);
    const hasDuplicates = priorities.length !== new Set(priorities).size;
    setError(hasDuplicates ? "Each payment method must have a unique priority." : null);
  }, [methods]);

  const handleChange = (id: string, key: "name" | "priority", value: string) => {
    const updated = methods.map((method) =>
      method.id === id
        ? {
            ...method,
            [key]: key === "priority" ? Math.max(1, parseInt(value)) || 1 : value
          }
        : method
    );
    setMethods(updated);
  };

  const addMethod = () => {
    setMethods([
      ...methods,
      {
        id: Date.now().toString(),
        name: "",
        priority: methods.length + 1
      }
    ]);
  };

  const handleSave = async () => {
    if (error) return;
    setButtonLoading(true);
    const payload = {
      paymentMethods: methods.map(({ name, priority }) => ({
        name,
        priority
      }))
    };

    const res = await fetch("/api/save_payment_methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      setError(data.message || "Failed to save priorities.");
      setSaveSuccess(false);
    } else {
      setError(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000); // Hide after 4s
    }
    setButtonLoading(false);
  };
  const handleActivate = async () => {
    setLoading(true);
    setError(""); // optional: reset error state if you're tracking errors
  
    try {
      const url = isActive ? "/api/deactivate_customization" : "/api/activate_customization";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
  
      const data = await response.json(); // 🔑 this actually reads the body
  
      console.log("API response:", data);
  
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unknown error from server");
      }
  
      setIsActive(!isActive);
    } catch (error: any) {
      console.error("Error toggling customization:", error);
      setError(error.message || "Something went wrong"); // optional: show error in UI
    } finally {
      setLoading(false);
    }
  };
  

  if (loading) {
    return (
<Page>
  <Layout>
    <Layout.Section>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner accessibilityLabel="Loading" size="large" />
      </div>
    </Layout.Section>
  </Layout>
</Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Payment Customizations" />

      <Layout>
        {!isActive ? (
          <Layout.Section>
            <Card padding="400">
              <BlockStack gap="300">
                <Banner tone="warning">
                  <Text as="h2" variant="headingSm">
                    Payment Customization is not activated
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Please activate payment customization before configuring methods.
                  </Text>
                </Banner>
                <Button onClick={handleActivate} variant="primary">
                  Activate
                </Button>
                <List type="number">
                  <List.Item>
                    Install the app and navigate to the main dashboard
                  </List.Item>
                  <List.Item>
                    Enable the Payment Customization function on your store
                  </List.Item>
                  <List.Item>
                    Open the Payment Section in new Tab
                  </List.Item>
                  <List.Item>
                    Copy Payment Method Names from the Payment Section
                  </List.Item>
                  <List.Item>
                    Paste them in order of priority (1 = highest priority, increasing numbers = lower priority)
                  </List.Item>
                  <List.Item>
                    Save your settings
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        ) : (
          <Layout.Section>
            <Card padding="400">
              <BlockStack gap="300">
                <Card>
                <Badge tone="success">Active</Badge>
                </Card>
                <Text as="h2" variant="headingMd">
                  Add Payment Method Priorities
                </Text>

                {methods.map((method, index) => (
                  <InlineStack key={method.id} align="space-between">
                    <TextField
                      label={`Method ${index + 1}`}
                      labelHidden
                      value={method.name}
                      onChange={(value) => handleChange(method.id, "name", value)}
                      placeholder="Payment method name"
                      autoComplete="off"
                    />
                    <TextField
                      label="Priority"
                      labelHidden
                      type="number"
                      min={1}
                      value={method.priority.toString()}
                      onChange={(value) => handleChange(method.id, "priority", value)}
                      autoComplete="off"
                    />
                  </InlineStack>
                ))}

                <Button icon={PlusCircleIcon} onClick={addMethod}>
                  Add Method
                </Button>

                {error && (
                  <Banner tone="critical">
                    <Text as="p" variant="bodyMd">
                      {error}
                    </Text>
                  </Banner>
                )}

<Button
  onClick={handleSave}
  disabled={!!error}
  variant="primary"
  loading={buttonLoading}
>
  Save Priorities
</Button>

{saveSuccess && (
  <Banner tone="success">
    <Text as="p" variant="bodyMd">
      Payment method priorities saved successfully.
    </Text>
  </Banner>
)}
                <List type="number">
                  <List.Item>
                    Install the app and navigate to the main dashboard
                  </List.Item>
                  <List.Item>
                    Enable the Payment Customization function on your store
                  </List.Item>
                  <List.Item>
                    Open the Payment Section in new Tab
                  </List.Item>
                  <List.Item>
                    Copy Payment Method Names from the Payment Section
                  </List.Item>
                  <List.Item>
                    Paste them in order of priority (1 = highest priority, increasing numbers = lower priority)
                  </List.Item>
                  <List.Item>
                    Save your settings
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}