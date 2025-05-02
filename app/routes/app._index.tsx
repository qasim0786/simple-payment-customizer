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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import { PlusCircleIcon } from "@shopify/polaris-icons";

export default function PaymentCustomizationPage() {
  const [methods, setMethods] = useState<{ id: string; name: string; priority: number }[]>([]);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
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
    } else {
      setError(null);
      alert("Saved successfully!");
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    if(isActive){
      await fetch("/api/deactivate_customization", { method: "POST" });
      setIsActive(false);
      setLoading(false);
    }else{
      await fetch("/api/activate_customization", { method: "POST" });
      setIsActive(true);
      setLoading(false);
    }

  };

  if (loading) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <Spinner accessibilityLabel="Loading" size="large" />
            </Card>
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

                <Button onClick={handleSave} disabled={!!error} variant="primary">
                  Save Priorities
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
        )}
      </Layout>
    </Page>
  );
}