import React, { useEffect, useState } from "react";
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  message,
  Table,
  Modal,
  Form,
  Row,
  Col,
  DatePicker,
  Tag,
  Divider,
  Empty,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getCustomers,
  addCustomer,
  getInvoicesByCustomer,
  addInvoiceForCustomer,
} from "../../Utils/Api"; // Assuming path is correct

const { Title, Text } = Typography;

interface Customer {
  _id: string;
  name: string;
  mobile: string;
  address?: string;
  invoiceCount?: number;
}

interface ProductRow {
  productName: string;
  price: number;
  qty: number;
  total?: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  courierName?: string;
  courierCharge?: number;
  totalAmount: number; // ✅ only products total (no courier)
  products: ProductRow[];
}

const CustomerInvoices: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [customerForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerInvoices, setCustomerInvoices] = useState<{
    [customerId: string]: Invoice[];
  }>({});
  const [invoicesLoadingCustomerId, setInvoicesLoadingCustomerId] = useState<
    string | null
  >(null);

  // ----------------- Data fetching -----------------

  const fetchCustomersList = async () => {
    try {
      setLoading(true);
      const res = await getCustomers(search ? { search } : {});
      const data = res.data || res;
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersList();
  }, [search]); // Reruns on search change

  const handleSearch = () => {
    fetchCustomersList();
  };

  const loadInvoicesForCustomer = async (customerId: string) => {
    try {
      setInvoicesLoadingCustomerId(customerId);
      const res = await getInvoicesByCustomer(customerId);
      const data = res.data || res;
      setCustomerInvoices((prev) => ({
        ...prev,
        [customerId]: data || [],
      }));
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch invoices");
    } finally {
      setInvoicesLoadingCustomerId(null);
    }
  };

  const handleExpandCustomer = (expanded: boolean, record: Customer) => {
    if (expanded && !customerInvoices[record._id]) {
      loadInvoicesForCustomer(record._id);
    }
  };

  // ----------------- Customer Handlers -----------------

  const handleOpenCustomerModal = () => {
    customerForm.resetFields();
    setCustomerModalOpen(true);
  };

  const handleSubmitCustomer = async (values: any) => {
    try {
      const payload = {
        name: values.name,
        mobile: values.mobile,
        address: values.address,
      };
      await addCustomer(payload);
      message.success("Customer added successfully");
      setCustomerModalOpen(false);
      await fetchCustomersList();
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 409) {
        message.error("Customer with this mobile already exists");
      } else {
        message.error("Failed to add customer");
      }
    }
  };

  // ----------------- Invoice Handlers -----------------

  const handleOpenInvoiceModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    invoiceForm.resetFields();
    invoiceForm.setFieldsValue({
      invoiceDate: dayjs(),
      products: [{ productName: "", price: 0, qty: 1 }],
      courierCharge: 0,
    });
    setInvoiceModalOpen(true);
  };

  const handleSubmitInvoice = async (values: any) => {
    if (!selectedCustomer) return;

    try {
      const payload = {
        invoiceNumber: values.invoiceNumber,
        invoiceDate: values.invoiceDate.format("YYYY-MM-DD"),
        courierName: values.courierName,
        courierCharge: Number(values.courierCharge || 0),
        products: (values.products || []).map((p: any) => ({
          productName: p.productName,
          price: Number(p.price || 0),
          qty: Number(p.qty || 0),
          total: Number(p.price || 0) * Number(p.qty || 0),
        })),
      };

      await addInvoiceForCustomer(selectedCustomer._id, payload);
      message.success("Invoice added successfully");
      setInvoiceModalOpen(false);
      await loadInvoicesForCustomer(selectedCustomer._id);
      await fetchCustomersList(); // refresh invoiceCount
    } catch (err) {
      console.error(err);
      message.error("Failed to add invoice");
    }
  };

  // ----------------- Columns -----------------

  const productColumns = [
    {
      title: "#",
      render: (_: any, __: ProductRow, index: number) => index + 1,
      width: 50,
      align: "center" as const,
    },
    {
      title: "Product",
      dataIndex: "productName",
    },
    {
      title: "Price",
      dataIndex: "price",
      align: "right" as const,
      render: (val: number) => `₹ ${val.toLocaleString("en-IN")}`,
    },
    {
      title: "Qty",
      dataIndex: "qty",
      align: "center" as const,
    },
    {
      title: "Total",
      dataIndex: "total",
      align: "right" as const,
      render: (val: number) => (
        <Text strong>₹ {val.toLocaleString("en-IN")}</Text>
      ),
    },
  ];

  const invoiceColumns = [
    {
      title: "#",
      render: (_: any, __: Invoice, index: number) => index + 1,
      width: 50,
      align: "center" as const,
    },
    {
      title: "Invoice Details",
      dataIndex: "invoiceNumber",
      render: (val: string, record: Invoice) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong style={{ color: "#0f172a" }}>
            {val}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(record.invoiceDate).format("DD-MM-YYYY")}
          </Text>
        </div>
      ),
    },
    {
      title: "Courier",
      render: (record: Invoice) =>
        record.courierName ? (
          <span>
            <Text style={{ fontWeight: 500 }}>{record.courierName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Charge: ₹ {record.courierCharge?.toLocaleString("en-IN") || 0}
            </Text>
          </span>
        ) : (
          <Text type="secondary">— No Courier —</Text>
        ),
    },
    {
      title: "Products Total",
      dataIndex: "totalAmount",
      align: "right" as const,
      render: (val: number) => (
        <span style={{ fontWeight: 700, color: "#16a34a" }}>
          ₹ {val.toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  const customerColumns = [
    {
      title: "#",
      render: (_: any, __: Customer, index: number) => index + 1,
      width: 60,
      align: "center" as const,
    },
    {
      title: "Customer Info",
      dataIndex: "name",
      render: (val: string, record: Customer) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {val?.[0]?.toUpperCase() || <UserOutlined />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#0f172a" }}>{val}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {record.address || "No address provided"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      render: (val: string) => (
        <Tag
          color="default"
          style={{
            fontFamily: "monospace",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {val}
        </Tag>
      ),
    },
    {
      title: "Invoices",
      dataIndex: "invoiceCount",
      width: 120,
      align: "center" as const,
      render: (val: number) => (
        <Tag
          color={val ? "blue" : "default"}
          icon={<FileTextOutlined />}
          style={{
            borderRadius: 16,
            padding: "4px 10px",
            fontWeight: 600,
          }}
        >
          {val || 0}
        </Tag>
      ),
    },
  ];

  // ----------------- Expanded row (Customer -> Invoices) -----------------

  const renderCustomerExpandedRow = (customer: Customer) => {
    const invoices = customerInvoices[customer._id] || [];

    return (
      <div
        style={{
          padding: "16px 20px",
          background: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          marginTop: 4,
        }}
      >
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0, color: "#1e293b" }}>
              Invoices for {customer.name}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {invoices.length} total invoice{invoices.length === 1 ? "" : "s"}
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="middle"
            onClick={() => handleOpenInvoiceModal(customer)}
            style={{
              borderRadius: 8,
              background: "#1d4ed8",
              borderColor: "#1d4ed8",
            }}
          >
            Add Invoice
          </Button>
        </div>

        {invoices.length === 0 ? (
          <Empty
            description={
              <span style={{ fontSize: 13 }}>
                No invoices yet. Click{" "}
                <Text strong style={{ color: "#1d4ed8" }}>
                  Add Invoice
                </Text>{" "}
                to create the first one.
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: "24px 0" }}
          />
        ) : (
          <Table
            rowKey="_id"
            columns={invoiceColumns}
            dataSource={invoices}
            size="middle"
            loading={invoicesLoadingCustomerId === customer._id}
            pagination={false}
            style={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            // 🔥 SCROLL IMPLEMENTATION 1: Invoice List Scroll
            scroll={{ y: 300 }}
            expandable={{
              rowExpandable: () => true,
              expandedRowRender: (invoice: Invoice) => (
                <div style={{ padding: 12, background: "#f1f5f9" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                      padding: "0 4px",
                    }}
                  >
                    <div>
                      <Text strong>Product Summary</Text>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {invoice.products.length} item
                        {invoice.products.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Text style={{ fontSize: 12, color: "#64748b" }}>
                        Products Total:
                      </Text>
                      <div style={{ fontWeight: 700, color: "#16a34a" }}>
                        ₹ {invoice.totalAmount.toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Grand Total (with courier):{" "}
                        <Text strong style={{ color: "#0f172a" }}>
                          ₹{" "}
                          {(
                            invoice.totalAmount + (invoice.courierCharge || 0)
                          ).toLocaleString("en-IN")}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Table
                    rowKey={(_, idx) => String(idx)}
                    columns={productColumns}
                    dataSource={invoice.products}
                    size="small"
                    pagination={false}
                    bordered
                    // 🔥 SCROLL IMPLEMENTATION 2: Product List Scroll
                    scroll={{ y: 200 }}
                  />
                </div>
              ),
            }}
          />
        )}
      </div>
    );
  };

  // ----------------- Render -----------------

  return (
    <div
      style={{
        padding: 24,
        // ✅ Make the outer container height auto to allow the entire page to scroll
        // Removed minHeight: "100vh"
        background: "#f4f7f9", // Light, clean background
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Card
        style={{
          maxWidth: 1200, // Slightly wider card
          margin: "0 auto",
          borderRadius: 12, // More standard corner radius
          boxShadow: "0 8px 30px rgba(17, 24, 39, 0.1)", // Cleaner shadow
          border: "1px solid #e5e7eb",
        }}
        bodyStyle={{ padding: 30 }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <Title
              level={3}
              style={{ margin: 0, color: "#111827", fontWeight: 700 }}
            >
              Customer & Invoice Management 📝
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Track customer details and their associated invoices in a single
              view.
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleOpenCustomerModal}
            style={{
              borderRadius: 8,
              background: "#10b981", // Teal/Green for positive action
              borderColor: "#10b981",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
            }}
          >
            Add New Customer
          </Button>
        </div>

        <Divider style={{ margin: "0 0 24px 0" }} />

        {/* Search & table */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Space>
            <Input
              placeholder="Search by name or mobile..."
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
              style={{
                width: 320,
                borderRadius: 8,
                paddingInline: 16,
              }}
            />
            <Button
              onClick={handleSearch}
              type="default"
              style={{ borderRadius: 8 }}
            >
              Search
            </Button>
          </Space>

          <Text type="secondary" style={{ fontSize: 14 }}>
            Total Customers: <Text strong>{customers.length}</Text>
          </Text>
        </div>

        <Table
          rowKey="_id"
          columns={customerColumns}
          dataSource={customers}
          loading={loading}
          pagination={false}
          scroll={{ x: 800, y: 500 }} // Horizontal scroll for smaller screens
          size="large"
          style={{
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
          // Outer customer list is handled by the main document scroll
          expandable={{
            rowExpandable: () => true,
            expandedRowRender: renderCustomerExpandedRow,
            onExpand: handleExpandCustomer,
            expandRowByClick: true, // Allow clicking row to expand
          }}
        />
      </Card>

      {/* Add Customer Modal */}
      <Modal
        // 1. Updated Title structure
        title={
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            New Customer Details
          </Title>
        }
        open={customerModalOpen}
        onCancel={() => setCustomerModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
        // 2. Added header extra for icon
        closeIcon={<span style={{ color: "#64748b" }}>&times;</span>}
        // 3. Adjusted body padding
        bodyStyle={{ padding: "16px 32px 32px 32px" }}
        style={{ borderRadius: 12, overflow: "hidden" }}
      >
        <Form
          layout="vertical"
          form={customerForm}
          onFinish={handleSubmitCustomer}
          // 4. Added custom margin/padding for better field spacing
          requiredMark={false}
        >
          <Form.Item
            label="Customer Name"
            name="name"
            rules={[{ required: true, message: "Please enter customer name" }]}
            style={{ marginBottom: 20 }}
          >
            <Input
              placeholder="E.g., Jane Doe"
              size="large"
              // Added modern radius to inputs
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item
            label="Mobile Number"
            name="mobile"
            rules={[{ required: true, message: "Please enter mobile number" }]}
            style={{ marginBottom: 20 }}
          >
            <Input
              placeholder="E.g., 9876543210"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            style={{ marginBottom: 32 }} // More space before the button
          >
            <Input.TextArea
              rows={2}
              placeholder="Full shipping/billing address (optional)"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item style={{ marginTop: 0, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                borderRadius: 8,
                // 5. Slightly darker shade for stronger button feel
                background: "#1e40af",
                borderColor: "#1e40af",
                height: 48,
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 4px 10px rgba(30, 64, 175, 0.2)",
              }}
            >
              Save New Customer
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Invoice Modal */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            <FileTextOutlined style={{ marginRight: 8, color: "#4f46e5" }} />
            Create New Invoice
          </Title>
        }
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
        // 1. Added body style for consistent padding and cleaner look
        bodyStyle={{ padding: "24px 30px" }}
        style={{ borderRadius: 12, overflow: "hidden" }}
      >
        {/* Custom Subheader for Customer Name */}
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 12,
            borderBottom: "2px solid #e0e7ff", // Subtle blue divider
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text strong style={{ fontSize: 16, color: "#1f2937" }}>
            Customer:{" "}
            <Text style={{ color: "#4f46e5", fontWeight: 700 }}>
              {selectedCustomer?.name || "N/A"}
            </Text>
          </Text>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Complete the form to generate the invoice.
          </Text>
        </div>

        <Form
          layout="vertical"
          form={invoiceForm}
          onFinish={handleSubmitInvoice}
          initialValues={{
            invoiceDate: dayjs(),
            products: [{ productName: "", price: 0, qty: 1 }],
            courierCharge: 0,
          }}
          requiredMark={false}
        >
          {/* Invoice Header Details */}
          <Card
            title={
              <Text strong style={{ color: "#4b5563" }}>
                Invoice Header
              </Text>
            }
            size="small"
            style={{
              marginBottom: 24,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="invoiceNumber"
                  label="Invoice Number"
                  rules={[{ required: true, message: "Enter invoice number" }]}
                >
                  <Input
                    placeholder="E.g., INV-2025-001"
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="invoiceDate"
                  label="Invoice Date"
                  rules={[{ required: true, message: "Select invoice date" }]}
                >
                  <DatePicker
                    format="DD-MM-YYYY"
                    style={{ width: "100%", borderRadius: 8 }}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Products List */}
          <Form.List name="products">
            {(fields, { add, remove }) => (
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "#1f2937",
                    }}
                  >
                    <Text strong style={{ fontSize: 16, color: "#1f2937" }}>
                      Product Items ({fields.length})
                    </Text>
                    <Button
                      type="primary" // Changed to primary for visibility
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      size="middle"
                      style={{
                        borderRadius: 8,
                        background: "#10b981",
                        borderColor: "#10b981",
                      }}
                    >
                      Add Product
                    </Button>
                  </div>
                }
                size="default" // Increased size
                style={{
                  marginBottom: 24,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
                bodyStyle={{ padding: "16px 12px" }}
              >
                {/* Header Row for Product List */}
                <Row
                  gutter={8}
                  style={{
                    marginBottom: 12,
                    fontWeight: 700,
                    padding: "0 8px",
                  }}
                >
                  <Col span={10}>Product Name</Col>
                  <Col span={4} style={{ textAlign: "right" }}>
                    Price (₹)
                  </Col>
                  <Col span={4} style={{ textAlign: "center" }}>
                    Qty
                  </Col>
                  <Col
                    span={4}
                    style={{ textAlign: "right", color: "#4f46e5" }}
                  >
                    Total (₹)
                  </Col>
                  <Col span={2}></Col>
                </Row>
                <Divider style={{ margin: "0 0 12px 0" }} />

                {/* Dynamic Product Rows */}
                <div
                  style={{ maxHeight: 300, overflowY: "auto", paddingRight: 8 }}
                >
                  {fields.map((field, index) => (
                    <Row
                      gutter={8}
                      key={field.key}
                      style={{
                        marginBottom: 12,
                        padding: "8px 4px",
                        borderRadius: 6,
                        // Subtle striped background for clarity
                        background: index % 2 === 1 ? "#f9fafb" : "transparent",
                      }}
                    >
                      <Col span={10}>
                        <Form.Item
                          {...field}
                          name={[field.name, "productName"]}
                          fieldKey={[
                            field.fieldKey ?? field.key,
                            "productName",
                          ]}
                          rules={[{ required: true, message: "Required" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            placeholder="Product Name"
                            style={{ borderRadius: 6 }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...field}
                          name={[field.name, "price"]}
                          fieldKey={[field.fieldKey ?? field.key, "price"]}
                          rules={[{ required: true, message: "Required" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            placeholder="0.00"
                            min={0}
                            style={{
                              width: "100%",
                              textAlign: "right",
                              borderRadius: 6,
                            }}
                            formatter={(value) =>
                              `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={
                              ((value: string | undefined) =>
                                Number(
                                  (value || "").replace(/₹\s?|(,*)/g, "")
                                )) as unknown as (displayValue?: string) => 0
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...field}
                          name={[field.name, "qty"]}
                          fieldKey={[field.fieldKey ?? field.key, "qty"]}
                          rules={[{ required: true, message: "Required" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            placeholder="1"
                            min={1}
                            precision={0}
                            style={{
                              width: "100%",
                              textAlign: "center",
                              borderRadius: 6,
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item shouldUpdate noStyle>
                          {() => {
                            const price = invoiceForm.getFieldValue([
                              "products",
                              field.name,
                              "price",
                            ]);
                            const qty = invoiceForm.getFieldValue([
                              "products",
                              field.name,
                              "qty",
                            ]);
                            const total = (
                              Number(price || 0) * Number(qty || 0)
                            ).toFixed(2);
                            return (
                              <Input
                                readOnly
                                value={total}
                                prefix="₹ "
                                style={{
                                  textAlign: "right",
                                  fontWeight: 700,
                                  color: "#4f46e5",
                                  background: "#eff6ff", // Light blue background for emphasis
                                  borderRadius: 6,
                                }}
                              />
                            );
                          }}
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button
                          danger
                          type="text"
                          onClick={() => remove(field.name)}
                          icon={<DeleteOutlined style={{ fontSize: 18 }} />}
                          disabled={fields.length === 1}
                          style={{ padding: 4, height: "auto" }}
                        />
                      </Col>
                    </Row>
                  ))}
                </div>
              </Card>
            )}
          </Form.List>

          {/* Courier Details & Totals Card */}
          <Card
            title={
              <Text strong style={{ color: "#4b5563" }}>
                Shipping and Final Charges
              </Text>
            }
            size="small"
            style={{
              marginBottom: 24,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="courierName" label="Courier/Shipping Name">
                  <Input
                    placeholder="E.g., FedEx, Local Pickup"
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="courierCharge"
                  label="Shipping/Courier Charge (₹)"
                  tooltip="This is added to the product total to get the Grand Total."
                >
                  <InputNumber
                    min={0}
                    placeholder="0"
                    style={{ width: "100%", borderRadius: 8 }}
                    size="large"
                    formatter={(value) =>
                      `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={
                      ((value: string | undefined) =>
                        Number(
                          (value || "").replace(/₹\s?|(,*)/g, "")
                        )) as unknown as (displayValue?: string) => 0
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                borderRadius: 8,
                // Stronger, slightly darker green
                background: "#059669",
                borderColor: "#059669",
                height: 50,
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 4px 10px rgba(5, 150, 105, 0.3)",
              }}
            >
              Save and Finalize Invoice
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerInvoices;
