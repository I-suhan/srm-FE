import { request } from '@umijs/max';

export type SrmRecord = Record<string, any> & { id?: number };

/** 读取 SRM 业务列表，API 返回值统一由后端 Result 包装。 */
export async function listSrmRecords(path: string) {
  const result = await request<API.Result<SrmRecord[]>>(`/api/${path}`, { method: 'GET' });
  return result.data ?? [];
}

/** 新建或全量更新 SRM 业务记录。 */
export async function saveSrmRecord(path: string, record: SrmRecord) {
  const { id, ...body } = record;
  const result = await request<API.Result<SrmRecord>>(
    id ? `/api/${path}/${id}` : `/api/${path}`,
    { method: id ? 'PUT' : 'POST', data: body },
  );
  return result.data;
}

/** 删除 SRM 业务记录。 */
export async function deleteSrmRecord(path: string, id: number) {
  return request<API.Result<null>>(`/api/${path}/${id}`, { method: 'DELETE' });
}
