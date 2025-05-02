import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Banner,
  Icon,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";


export default function AdditionalPage() {
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/app/api/activation_status");
      const data = await response.json();
      console.log(data);
      setIsActive(data.isActive);
    };
    fetchData();
  }, []);

  //functions which will activate and deactivate the Payment Customization status
  const handleActivate = async () => {
    setIsActive(!isActive);
    if(isActive){
      await fetch("/api/deactivate_customization", { method: "POST" });
    }else{
      await fetch("/api/activate_customization", { method: "POST" });
    }
    
  }
  return (
    <Page>
      <TitleBar title="Payment Method Customization Guide" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Welcome to Payment Method Customizer
                </Text>
                <Text as="p" variant="bodyMd">
                  This app allows you to customize the order of payment methods displayed on your store's checkout page. 
                  By reordering payment methods, you can prioritize your preferred payment options and optimize your checkout experience.
                </Text>
              </BlockStack>
            </Card>
            <Card>
            <Banner
              title="Enable Payment Customization"  tone={isActive? undefined :"critical"} >
              <p style={{padding: "10px"}}>{isActive? "The Button Below will disable the Payment Customization function on your store."
                 :
               "To complete the setup, you need to enable the Payment Customization function on your store. Click the activation button below to disable this feature.Click the activation button below to enable this feature."
                }
              </p>
              <Button tone={isActive? "critical" :undefined}
               onClick={handleActivate}>
                {isActive? "Disable Payment Customization" : "Enable Payment Customization"}
                </Button>
            </Banner>
            </Card>


            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  How Payment Method Customization Works
                </Text>
                <Text as="p" variant="bodyMd">
                  The app uses Shopify's Payment Customization API to modify the order of payment methods. 
                  When enabled, your payment methods will be displayed according to the priorities you set.
                </Text>
              </BlockStack>
            </Card>


            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Step-by-Step Guide
                </Text>
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


            
           
          </BlockStack>
          <Card>
          <Banner title="Need Help" tone="info" >
            <p>
              If you need help or if you have any feedback, please contact me at <a href="qasimmlk097@gmail.com">support@technospike.com</a>.
            </p>
          </Banner>
          </Card>

          <BlockStack>

          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card >
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Important Notes
              </Text>
              <List>
                <List.Item>
                  Make sure payment method names match exactly
                </List.Item>
                <List.Item>
                  Priority numbers must be unique
                </List.Item>
                <List.Item>
                  Changes may take a few minutes to reflect
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


