import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteSrmRecord,
  listSrmRecords,
  type SrmRecord,
  saveSrmRecord,
} from '@/services/srm/api';

type Field = {
  name: string;
  label: string;
  relation?: string;
  required?: boolean;
};
type Resource = {
  key: string;
  title: string;
  path: string;
  fields: Field[];
  columns: { key: string; label: string }[];
};

const resources: Resource[] = [
  {
    key: 'products',
    title: '商品',
    path: 'products',
    fields: [
      { name: 'sku', label: 'SKU', required: true },
      { name: 'photo', label: '图片地址' },
      { name: 'namePl', label: '原文名称' },
      { name: 'descriptionPl', label: '原文描述' },
      { name: 'color', label: '颜色' },
      { name: 'needCE', label: '需要 CE（true/false）' },
      { name: 'manuals', label: '需要说明书（true/false）' },
      { name: 'stickers', label: '需要贴纸（true/false）' },
    ],
    columns: [
      { key: 'sku', label: 'SKU' },
      { key: 'namePl', label: '名称' },
      { key: 'color', label: '颜色' },
      { key: 'needCE', label: '需要 CE' },
      { key: 'manuals', label: '需要说明书' },
      { key: 'stickers', label: '需要贴纸' },
    ],
  },
  {
    key: 'inquiry',
    title: '询价',
    path: 'inquiry',
    fields: [
      { name: 'inquiryNo', label: '询价批次', required: true },
      {
        name: 'productId',
        label: '商品',
        relation: 'products',
        required: true,
      },
      { name: 'physicalPicture', label: '实物图片地址' },
      { name: 'targetPrice', label: '目标价' },
      { name: 'exwPrice', label: '出厂价' },
      { name: 'logoPrice', label: 'Logo 价格' },
      { name: 'shippingPrice', label: '运费' },
      { name: 'invoiceExtra', label: '票面加点' },
      { name: 'actualExtra', label: '实际加点' },
      { name: 'invoice_type', label: '发票类型', relation: 'dict-items' },
      {
        name: 'containerLoadTypeId',
        label: '装柜类型',
        relation: 'dict-items',
      },
      { name: 'inquiryQuantity', label: '询价数量' },
      { name: 'shopName', label: '店铺名称' },
      { name: 'shopContact', label: '联系人' },
      { name: 'cartonPcs', label: '每箱件数' },
      { name: 'cartonNumber', label: '箱数' },
      { name: 'cartonWeight', label: '箱重' },
      { name: 'cartonCbm', label: '箱体积（CBM）' },
      { name: 'cartonSize', label: '箱规' },
      { name: 'statusCode', label: '状态编码' },
      { name: 'owner', label: '负责人' },
    ],
    columns: [
      { key: 'inquiryNo', label: '询价批次' },
      { key: 'product', label: '商品' },
      { key: 'inquiryQuantity', label: '数量' },
      { key: 'statusCode', label: '状态' },
      { key: 'owner', label: '负责人' },
    ],
  },
  {
    key: 'orders',
    title: '订单',
    path: 'orders',
    fields: [
      { name: 'orderNo', label: '订单批次', required: true },
      { name: 'inquiryId', label: '询价', relation: 'inquiry', required: true },
      { name: 'quantity', label: '采购数量' },
      { name: 'statusCode', label: '状态编码' },
    ],
    columns: [
      { key: 'orderNo', label: '订单批次' },
      { key: 'inquiry', label: '询价' },
      { key: 'quantity', label: '采购数量' },
      { key: 'statusCode', label: '状态' },
    ],
  },
  {
    key: 'contracts',
    title: '合同',
    path: 'contracts',
    fields: [
      { name: 'contractNo', label: '合同编号', required: true },
      { name: 'orderId', label: '订单', relation: 'orders', required: true },
      { name: 'contractTypeCode', label: '合同类型编码' },
      { name: 'contractStatusCode', label: '合同状态编码' },
      { name: 'totalAmount', label: '合同金额' },
      { name: 'totalAmountUp', label: '金额大写' },
      { name: 'currencyCode', label: '币种' },
      { name: 'signDate', label: '签署时间戳（毫秒）' },
      { name: 'paymentStatusCode', label: '付款状态编码' },
      { name: 'contractTermId', label: '合同条款', relation: 'contract-terms' },
      { name: 'owner', label: '负责人' },
    ],
    columns: [
      { key: 'contractNo', label: '合同编号' },
      { key: 'order', label: '订单' },
      { key: 'contractTypeCode', label: '类型' },
      { key: 'contractStatusCode', label: '状态' },
      { key: 'totalAmount', label: '金额' },
    ],
  },
  {
    key: 'contract-items',
    title: '合同明细',
    path: 'contract-items',
    fields: [
      {
        name: 'contractId',
        label: '合同',
        relation: 'contracts',
        required: true,
      },
      { name: 'productId', label: '商品', relation: 'products' },
      { name: 'productName', label: '品名' },
      { name: 'productUnit', label: '单位' },
      { name: 'color', label: '颜色' },
      { name: 'productDescription', label: '产品描述' },
      { name: 'deliveryDate', label: '交期' },
      { name: 'invoiceType', label: '发票类型' },
      { name: 'unitPrice', label: '单价' },
      { name: 'cartonPcs', label: '每箱件数' },
      { name: 'cartonWeight', label: '箱重' },
      { name: 'cartonCbm', label: '箱体积（CBM）' },
      { name: 'cartonSize', label: '箱规' },
      { name: 'cartonNum', label: '箱数' },
      { name: 'quantity', label: '数量' },
      { name: 'amount', label: '金额' },
      { name: 'remark', label: '备注' },
    ],
    columns: [
      { key: 'contract', label: '合同' },
      { key: 'product', label: '商品' },
      { key: 'productName', label: '品名' },
      { key: 'quantity', label: '数量' },
      { key: 'amount', label: '金额' },
    ],
  },
  {
    key: 'contract-terms',
    title: '合同条款',
    path: 'contract-terms',
    fields: [
      { name: 'term', label: '条款正文', required: true },
      { name: 'version', label: '版本' },
    ],
    columns: [
      { key: 'term', label: '条款正文' },
      { key: 'version', label: '版本' },
    ],
  },
  {
    key: 'receipts',
    title: '收货记录',
    path: 'receipts',
    fields: [
      { name: 'receiptNo', label: '收货编号', required: true },
      {
        name: 'contractId',
        label: '合同',
        relation: 'contracts',
        required: true,
      },
      { name: 'receivableQuantity', label: '应收数量' },
      { name: 'receivedQuantity', label: '实收数量' },
      { name: 'receiptTime', label: '收货时间戳（毫秒）' },
      { name: 'warehouseRemark', label: '仓库备注' },
      { name: 'statusCode', label: '状态编码' },
    ],
    columns: [
      { key: 'receiptNo', label: '收货编号' },
      { key: 'contract', label: '合同' },
      { key: 'receivableQuantity', label: '应收数量' },
      { key: 'receivedQuantity', label: '实收数量' },
      { key: 'statusCode', label: '状态' },
    ],
  },
  {
    key: 'dict-types',
    title: '字典类型',
    path: 'dict/types',
    fields: [
      { name: 'dictCode', label: '字典类型编码', required: true },
      { name: 'dictName', label: '字典类型名称', required: true },
      { name: 'remark', label: '备注' },
    ],
    columns: [
      { key: 'dictCode', label: '字典编码' },
      { key: 'dictName', label: '字典名称' },
      { key: 'remark', label: '备注' },
    ],
  },
  {
    key: 'dict-items',
    title: '字典项',
    path: 'dict/items',
    fields: [
      {
        name: 'dictCode',
        label: '字典类型',
        required: true,
        relation: 'dict-types',
      },
      { name: 'itemCode', label: '字典编码', required: true },
      { name: 'itemName', label: '字典名称', required: true },
      { name: 'sortNo', label: '排序号' },
      { name: 'enabled', label: '启用（1/0）' },
      { name: 'remark', label: '备注' },
    ],
    columns: [
      { key: 'dictCode', label: '字典编码' },
      { key: 'itemCode', label: '项编码' },
      { key: 'itemName', label: '项名称' },
      { key: 'sortNo', label: '排序' },
      { key: 'enable', label: '启用' },
    ],
  },
  {
    key: 'files',
    title: '文件元数据',
    path: 'files',
    fields: [
      { name: 'fileName', label: '文件名', required: true },
      { name: 'filePath', label: '文件路径', required: true },
      { name: 'fileSize', label: '文件大小（字节）' },
      { name: 'contentType', label: '文件类型' },
      { name: 'fileMd5', label: 'MD5' },
      { name: 'createBy', label: '创建人' },
    ],
    columns: [
      { key: 'fileName', label: '文件名' },
      { key: 'filePath', label: '文件路径' },
      { key: 'contentType', label: '文件类型' },
      { key: 'createBy', label: '创建人' },
    ],
  },
  {
    key: 'attachments',
    title: '业务附件关联',
    path: 'files/attachments',
    fields: [
      { name: 'sysFileId', label: '文件', relation: 'files', required: true },
      {
        name: 'businessTypeCode',
        label: '业务类型（如 INQUIRY）',
        required: true,
      },
      { name: 'businessId', label: '业务记录 ID', required: true },
      { name: 'attachmentCategoryCode', label: '附件分类编码' },
      { name: 'attachmentTypeCode', label: '附件类型编码' },
      { name: 'remark', label: '备注' },
    ],
    columns: [
      { key: 'sysFile', label: '文件' },
      { key: 'businessTypeCode', label: '业务类型' },
      { key: 'businessId', label: '业务 ID' },
      { key: 'attachmentCategoryCode', label: '附件分类' },
    ],
  },
];

const relationPaths: Record<string, string> = {
  products: 'products',
  inquiry: 'inquiry',
  orders: 'orders',
  contracts: 'contracts',
  files: 'files',
  'dict-items': 'dict/items',
  'contract-terms': 'contract-terms',
};

/** SRM 基础业务台：通过后端现有 REST 接口维护主数据与采购流程记录。 */
export default function SrmPage() {
  const { message: toast } = App.useApp();
  const [activeKey, setActiveKey] = useState(resources[0].key);
  const [rows, setRows] = useState<SrmRecord[]>([]);
  const [related, setRelated] = useState<Record<string, SrmRecord[]>>({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SrmRecord>();
  const [form] = Form.useForm();
  const resource =
    resources.find(({ key }) => key === activeKey) ?? resources[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSrmRecords(resource.path);
      setRows(data);
    } catch {
      toast.error(`读取${resource.title}列表失败`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [resource, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const paths = Array.from(
      new Set(
        resource.fields
          .flatMap((field) =>
            field.relation ? [relationPaths[field.relation]] : [],
          )
          .filter(Boolean),
      ),
    );
    if (paths.length === 0) return;
    void Promise.all(
      paths.map(async (path) => [path, await listSrmRecords(path)] as const),
    )
      .then((entries) =>
        setRelated((current) => ({
          ...current,
          ...Object.fromEntries(entries),
        })),
      )
      .catch(() => toast.error('读取关联选项失败'));
  }, [resource, toast]);

  const showCreate = () => {
    setEditing(undefined);
    form.resetFields();
    setModalOpen(true);
  };

  const showEdit = (row: SrmRecord) => {
    setEditing(row);
    const values = { ...row };
    for (const field of resource.fields) {
      if (field.relation)
        values[field.name] = row[field.name.replace('Id', '')]?.id;
    }
    form.setFieldsValue(values);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const payload: SrmRecord = {
      ...values,
      ...(editing?.id ? { id: editing.id } : {}),
    };
    for (const field of resource.fields) {
      if (field.relation) {
        const id = payload[field.name];
        payload[field.name.replace('Id', '')] = id ? { id: Number(id) } : null;
        delete payload[field.name];
      }
    }
    try {
      await saveSrmRecord(resource.path, payload);
      toast.success('保存成功');
      setModalOpen(false);
      await load();
    } catch {
      toast.error('保存失败，请检查必填字段和关联数据');
    }
  };

  const remove = async (row: SrmRecord) => {
    if (!row.id) return;
    try {
      await deleteSrmRecord(resource.path, row.id);
      toast.success('删除成功');
      await load();
    } catch {
      toast.error('删除失败；记录可能仍被其他业务数据引用');
    }
  };

  const columns = useMemo<ColumnsType<SrmRecord>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      ...resource.columns.map(({ key, label }) => ({
        title: label,
        dataIndex: key,
        key,
        render: (_value: unknown, row: SrmRecord) => {
          const value = row[key];
          if (value && typeof value === 'object')
            return (
              value.inquiryNo ??
              value.orderNo ??
              value.contractNo ??
              value.sku ??
              value.dictName ??
              value.itemName ??
              `#${value.id ?? ''}`
            );
          return value === null || value === undefined || value === ''
            ? '—'
            : String(value);
        },
      })),
      {
        title: '操作',
        key: 'action',
        width: 140,
        render: (_value: unknown, row: SrmRecord) => (
          <Space>
            <Button type="link" onClick={() => showEdit(row)}>
              编辑
            </Button>
            <Popconfirm
              title="确认删除这条记录？"
              onConfirm={() => void remove(row)}
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [resource],
  );

  return (
    <PageContainer title="SRM 采购业务">
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={resources.map(({ key, title }) => ({ key, label: title }))}
      />
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={showCreate}>
          新增{resource.title}
        </Button>
        <Button onClick={() => void load()}>刷新</Button>
      </Space>
      <Table<SrmRecord>
        rowKey={(row) => String(row.id ?? '')}
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: true }}
      />
      <Modal
        title={`${editing ? '编辑' : '新增'}${resource.title}`}
        open={modalOpen}
        onOk={() => void submit()}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          {resource.fields.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={
                field.required
                  ? [{ required: true, message: `请输入${field.label}` }]
                  : undefined
              }
            >
              {field.relation ? (
                <Select
                  allowClear
                  showSearch={{ optionFilterProp: 'label' }}
                  options={(related[relationPaths[field.relation]] ?? []).map(
                    (item) => ({
                      value: item.id,
                      label: `${item.inquiryNo ?? item.orderNo ?? item.contractNo ?? item.sku ?? item.nameZh ?? item.term ?? item.itemName ?? item.fileName ?? `#${item.id}`} · ${item.id}`,
                    }),
                  )}
                />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </PageContainer>
  );
}
