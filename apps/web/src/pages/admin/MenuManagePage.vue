<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">菜单管理</h2>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="菜品" name="items">
        <div class="mb-3 flex items-center gap-3">
          <el-select v-model="filterCategoryId" placeholder="全部分类" clearable @change="loadItems">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-button type="primary" @click="openItemEditor()">新增菜品</el-button>
        </div>
        <el-table :data="items" v-loading="itemsLoading" stripe>
          <el-table-column label="ID" prop="id" width="60" />
          <el-table-column label="分类" width="120">
            <template #default="{ row }">{{ categoryNameOf(row.categoryId) }}</template>
          </el-table-column>
          <el-table-column label="名称" prop="name" />
          <el-table-column label="价格" width="100">
            <template #default="{ row }">¥{{ centsToYuan(row.price) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '上架' : '下架' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="排序" prop="sortOrder" width="80" />
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button size="small" @click="openItemEditor(row)">编辑</el-button>
              <el-button size="small" @click="toggleItemStatus(row)">
                {{ row.status === 'active' ? '下架' : '上架' }}
              </el-button>
              <el-button size="small" type="danger" @click="removeItem(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="分类" name="categories">
        <div class="mb-3">
          <el-button type="primary" @click="openCategoryEditor()">新增分类</el-button>
        </div>
        <el-table :data="categories" v-loading="catsLoading" stripe>
          <el-table-column label="ID" prop="id" width="60" />
          <el-table-column label="名称" prop="name" />
          <el-table-column label="排序" prop="sortOrder" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="openCategoryEditor(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="removeCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Item editor -->
    <el-dialog v-model="itemEditorVisible" :title="itemForm.id ? '编辑菜品' : '新增菜品'" width="500px">
      <el-form :model="itemForm" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="itemForm.categoryId" placeholder="请选择">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="itemForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="itemForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="价格(元)">
          <el-input-number v-model="itemForm.priceYuan" :precision="2" :min="0" :step="0.5" />
        </el-form-item>
        <el-form-item label="图片">
          <el-input v-model="itemForm.imageUrl" placeholder="图片 URL" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="itemForm.status"
            active-value="active"
            inactive-value="inactive"
            active-text="上架"
            inactive-text="下架"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemEditorVisible = false">取消</el-button>
        <el-button type="primary" :loading="itemSaving" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>

    <!-- Category editor -->
    <el-dialog v-model="categoryEditorVisible" :title="categoryForm.id ? '编辑分类' : '新增分类'" width="400px">
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="categoryForm.name" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="categoryForm.status"
            active-value="active"
            inactive-value="inactive"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryEditorVisible = false">取消</el-button>
        <el-button type="primary" :loading="categorySaving" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminListMenuItems,
  adminCreateMenuItem,
  adminUpdateMenuItem,
  adminDeleteMenuItem,
} from '@/api/menu';
import { centsToYuan, yuanToCents, type Category, type MenuItem } from '@mealping/shared';

const activeTab = ref<'items' | 'categories'>('items');

const categories = ref<Category[]>([]);
const items = ref<MenuItem[]>([]);
const catsLoading = ref(false);
const itemsLoading = ref(false);
const filterCategoryId = ref<number | undefined>();

async function loadCategories() {
  catsLoading.value = true;
  try {
    categories.value = await adminListCategories();
  } finally {
    catsLoading.value = false;
  }
}

async function loadItems() {
  itemsLoading.value = true;
  try {
    items.value = await adminListMenuItems(filterCategoryId.value);
  } finally {
    itemsLoading.value = false;
  }
}

function categoryNameOf(id: number) {
  return categories.value.find((c) => c.id === id)?.name ?? '-';
}

// ==== Item editor ====
const itemEditorVisible = ref(false);
const itemSaving = ref(false);
const itemForm = reactive({
  id: 0 as number,
  categoryId: 0 as number,
  name: '',
  description: '',
  priceYuan: 0,
  imageUrl: '',
  status: 'active' as 'active' | 'inactive',
  sortOrder: 0,
});

function openItemEditor(row?: MenuItem) {
  if (row) {
    itemForm.id = row.id;
    itemForm.categoryId = row.categoryId;
    itemForm.name = row.name;
    itemForm.description = row.description ?? '';
    itemForm.priceYuan = row.price / 100;
    itemForm.imageUrl = row.imageUrl ?? '';
    itemForm.status = row.status as 'active' | 'inactive';
    itemForm.sortOrder = row.sortOrder;
  } else {
    itemForm.id = 0;
    itemForm.categoryId = categories.value[0]?.id ?? 0;
    itemForm.name = '';
    itemForm.description = '';
    itemForm.priceYuan = 0;
    itemForm.imageUrl = '';
    itemForm.status = 'active';
    itemForm.sortOrder = 0;
  }
  itemEditorVisible.value = true;
}

async function saveItem() {
  if (!itemForm.categoryId || !itemForm.name) {
    ElMessage.warning('请填写分类和名称');
    return;
  }
  itemSaving.value = true;
  try {
    const payload = {
      categoryId: itemForm.categoryId,
      name: itemForm.name,
      description: itemForm.description || null,
      price: yuanToCents(itemForm.priceYuan),
      imageUrl: itemForm.imageUrl || null,
      status: itemForm.status,
      sortOrder: itemForm.sortOrder,
    };
    if (itemForm.id) await adminUpdateMenuItem(itemForm.id, payload);
    else await adminCreateMenuItem(payload);
    ElMessage.success('已保存');
    itemEditorVisible.value = false;
    loadItems();
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(msg || '保存失败');
  } finally {
    itemSaving.value = false;
  }
}

async function toggleItemStatus(row: MenuItem) {
  const next = row.status === 'active' ? 'inactive' : 'active';
  try {
    const updated = await adminUpdateMenuItem(row.id, { status: next });
    Object.assign(row, updated);
  } catch {
    ElMessage.error('操作失败');
  }
}

async function removeItem(row: MenuItem) {
  try {
    await ElMessageBox.confirm(`确认删除 ${row.name}？`, '删除菜品');
  } catch {
    return;
  }
  try {
    await adminDeleteMenuItem(row.id);
    ElMessage.success('已删除');
    loadItems();
  } catch {
    ElMessage.error('删除失败');
  }
}

// ==== Category editor ====
const categoryEditorVisible = ref(false);
const categorySaving = ref(false);
const categoryForm = reactive({
  id: 0 as number,
  name: '',
  sortOrder: 0,
  status: 'active' as 'active' | 'inactive',
});

function openCategoryEditor(row?: Category) {
  if (row) {
    categoryForm.id = row.id;
    categoryForm.name = row.name;
    categoryForm.sortOrder = row.sortOrder;
    categoryForm.status = row.status as 'active' | 'inactive';
  } else {
    categoryForm.id = 0;
    categoryForm.name = '';
    categoryForm.sortOrder = 0;
    categoryForm.status = 'active';
  }
  categoryEditorVisible.value = true;
}

async function saveCategory() {
  if (!categoryForm.name) {
    ElMessage.warning('请填写分类名称');
    return;
  }
  categorySaving.value = true;
  try {
    const payload = {
      name: categoryForm.name,
      sortOrder: categoryForm.sortOrder,
      status: categoryForm.status,
    };
    if (categoryForm.id) await adminUpdateCategory(categoryForm.id, payload);
    else await adminCreateCategory(payload);
    ElMessage.success('已保存');
    categoryEditorVisible.value = false;
    await loadCategories();
    loadItems();
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(msg || '保存失败');
  } finally {
    categorySaving.value = false;
  }
}

async function removeCategory(row: Category) {
  try {
    await ElMessageBox.confirm(`确认删除分类 ${row.name}？`, '删除分类');
  } catch {
    return;
  }
  try {
    await adminDeleteCategory(row.id);
    ElMessage.success('已删除');
    if (filterCategoryId.value === row.id) filterCategoryId.value = undefined;
    await loadCategories();
    await loadItems();
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(msg || '删除失败');
  }
}

onMounted(async () => {
  await loadCategories();
  await loadItems();
});
</script>
