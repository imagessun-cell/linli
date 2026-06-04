<template>
  <div class="search-page">
    <h1 class="page-title">任务搜索</h1>

    <div class="search-bar" role="search">
      <label for="task-search-input" class="sr-only">搜索任务</label>
      <div class="search-input-wrapper">
        <input
          id="task-search-input"
          v-model="keyword"
          type="search"
          class="search-input"
          placeholder="搜索医院、科室或陪诊师"
          autocomplete="off"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          @keydown.esc="showSuggest = false"
          @keydown.enter="applyFilter"
        />
        <button
          v-if="keyword"
          type="button"
          class="clear-btn"
          aria-label="清除搜索"
          @mousedown.prevent
          @click="clearKeyword"
        >×</button>

        <ul
          v-if="showSuggest && filteredSuggest.length > 0"
          class="suggest-list"
          role="listbox"
        >
          <li
            v-for="(s, idx) in filteredSuggest"
            :key="s.text + '-' + idx"
            class="suggest-item"
            role="option"
            :aria-selected="highlightIdx === idx"
            :class="{ active: highlightIdx === idx }"
            @mousedown.prevent="applySuggest(s)"
          >
            <span class="suggest-icon" aria-hidden="true">{{ iconOf(s.kind) }}</span>
            <span class="suggest-text" v-html="highlight(s.text, keyword)"></span>
            <span class="suggest-kind">{{ labelOf(s.kind) }}</span>
          </li>
        </ul>

        <p
          v-else-if="showSuggest && keyword && filteredSuggest.length === 0"
          class="suggest-empty"
        >暂无匹配结果</p>
      </div>
      <button
        type="button"
        class="search-btn"
        :disabled="!keyword.trim()"
        @click="applyFilter"
      >搜索</button>
    </div>

    <main class="result-list" role="main">
      <h2 class="result-title">
        任务列表 <span class="result-count">({{ filteredTasks.length }})</span>
      </h2>
      <p v-if="searchTerm" class="active-filter">
        当前筛选：<span class="filter-chip">{{ searchTerm }}</span>
        <button class="filter-clear" @click="clearKeyword">清除</button>
      </p>

      <p v-if="filteredTasks.length === 0" class="result-empty">
        暂无匹配结果
      </p>

      <article
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-card"
        tabindex="0"
        :aria-label="`${task.hospital} ${task.department}`"
      >
        <div class="task-card-header">
          <h3 class="task-hospital">{{ task.hospital }}</h3>
          <span class="task-price">¥{{ task.price }}</span>
        </div>
        <p class="task-dept">科室：{{ task.department }}</p>
        <p class="task-caregiver">陪诊师：{{ task.caregiver }}</p>
        <span class="task-type">{{ task.type }}</span>
      </article>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

// ---------- 示例数据 ----------
const tasks = ref([
  { id: 1, hospital: '北京大学第三医院', department: '心血管内科', caregiver: '李陪诊师', price: 90, type: '全程陪同' },
  { id: 2, hospital: '北京协和医院',     department: '呼吸内科',   caregiver: '王陪诊师', price: 40, type: '挂号取药' },
  { id: 3, hospital: '北京协和医院',     department: '消化内科',   caregiver: '张陪诊师', price: 60, type: '门诊陪护' },
  { id: 4, hospital: '中国人民解放军总医院', department: '骨科',    caregiver: '陈陪诊师', price: 120, type: '全程陪同' },
  { id: 5, hospital: '北京大学第三医院', department: '内分泌科',   caregiver: '赵陪诊师', price: 70, type: '代为问诊' },
  { id: 6, hospital: '北京安贞医院',     department: '心血管内科', caregiver: '李陪诊师', price: 80, type: '门诊陪护' },
  { id: 7, hospital: '中日友好医院',     department: '神经内科',   caregiver: '王陪诊师', price: 100, type: '全程陪同' }
])

// ---------- 状态 ----------
// keyword：输入框双向绑定值（v-model）
// searchTerm：实际用于筛选的关键词（点击建议 / 按回车 / 点击搜索按钮时更新）
const keyword = ref('')
const searchTerm = ref('')
const showSuggest = ref(false)
const highlightIdx = ref(-1)
let debounceTimer = null

// ---------- 联想词源：去重 + 标记类型 ----------
const suggestPool = computed(() => {
  const map = new Map()
  tasks.value.forEach((t) => {
    ;[
      { text: t.hospital,   kind: 'hospital' },
      { text: t.department, kind: 'department' },
      { text: t.caregiver,  kind: 'caregiver' }
    ].forEach(({ text, kind }) => {
      if (text && !map.has(text)) {
        map.set(text, { text, kind })
      }
    })
  })
  return Array.from(map.values())
})

const filteredSuggest = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return []
  return suggestPool.value
    .filter((s) => s.text.toLowerCase().includes(q))
    .slice(0, 8)
})

// ---------- 任务列表过滤：基于 searchTerm ----------
const filteredTasks = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return tasks.value
  return tasks.value.filter((t) => {
    return (
      (t.hospital   || '').toLowerCase().includes(q) ||
      (t.department || '').toLowerCase().includes(q) ||
      (t.caregiver  || '').toLowerCase().includes(q) ||
      (t.type       || '').toLowerCase().includes(q)
    )
  })
})

// ---------- 事件 ----------
const onInput = () => {
  highlightIdx.value = -1
  showSuggest.value = true
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    // 联想下拉由 computed 自动更新；防抖 300ms 仅控制提示节奏
  }, 300)
}

const onFocus = () => {
  showSuggest.value = true
}

const onBlur = () => {
  setTimeout(() => { showSuggest.value = false }, 150)
}

const clearKeyword = () => {
  keyword.value = ''
  searchTerm.value = ''
  showSuggest.value = false
  highlightIdx.value = -1
}

// 点击搜索按钮 / 按回车：将当前 keyword 应用为筛选词
const applyFilter = () => {
  searchTerm.value = keyword.value.trim()
  showSuggest.value = false
  highlightIdx.value = -1
}

// 点击联想项：填入输入框 + 立即应用为筛选词
const applySuggest = (s) => {
  keyword.value = s.text
  searchTerm.value = s.text
  showSuggest.value = false
  highlightIdx.value = -1
}

const iconOf = (kind) => {
  return kind === 'hospital' ? '🏥'
    : kind === 'department' ? '🩺'
    : '👨‍⚕️'
}

const labelOf = (kind) => {
  return kind === 'hospital' ? '医院'
    : kind === 'department' ? '科室'
    : '陪诊师'
}

const highlight = (text, q) => {
  if (!q) return text
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return String(text).replace(new RegExp(safe, 'gi'), (m) => `<mark>${m}</mark>`)
}

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
.search-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  background: #fafafa;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  color: #1a1a1a;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 24px;
  color: #0a0a0a;
}

.search-bar {
  position: relative;
  background: #fff;
  border-radius: 16px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.search-input {
  width: 100%;
  min-height: 56px;
  font-size: 18px;
  padding: 14px 48px 14px 18px;
  border: 2px solid #d8d8d8;
  border-radius: 12px;
  outline: none;
  background: #fff;
  color: #1a1a1a;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  -webkit-appearance: none;
}

.search-input::placeholder {
  color: #999;
}

.search-input:focus {
  border-color: #0066cc;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.18);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  background: #e8e8e8;
  color: #555;
  border-radius: 50%;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: #d0d0d0;
}

.search-btn {
  min-width: 88px;
  min-height: 56px;
  padding: 0 20px;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  background: #0066cc;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-btn:hover:not(:disabled) {
  background: #0055aa;
}

.search-btn:disabled {
  background: #b8c8d8;
  cursor: not-allowed;
}

.suggest-list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  max-height: 400px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 6px 0;
  z-index: 100;
}

.suggest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 12px 18px;
  font-size: 17px;
  color: #1a1a1a;
  cursor: pointer;
  transition: background 0.15s;
}

.suggest-item:hover,
.suggest-item.active {
  background: #e6f0ff;
}

.suggest-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 28px;
  text-align: center;
}

.suggest-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggest-text :deep(mark) {
  background: transparent;
  color: #0066cc;
  font-weight: 700;
}

.suggest-kind {
  font-size: 13px;
  color: #666;
  background: #f0f0f0;
  padding: 3px 10px;
  border-radius: 10px;
  flex-shrink: 0;
}

.suggest-empty,
.result-empty {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px 18px;
  text-align: center;
  color: #888;
  font-size: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.result-list {
  margin-top: 24px;
}

.result-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #1a1a1a;
}

.result-count {
  color: #0066cc;
  font-weight: 700;
  font-size: 18px;
}

.active-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 15px;
  color: #555;
}

.filter-chip {
  display: inline-block;
  padding: 4px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #0066cc;
  background: #e6f0ff;
  border-radius: 16px;
}

.filter-clear {
  border: none;
  background: transparent;
  color: #0066cc;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
  padding: 4px 8px;
}

.result-empty {
  position: static;
  box-shadow: none;
  border: 1px dashed #d0d0d0;
}

.task-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  outline: none;
  transition: box-shadow 0.2s, transform 0.2s;
}

.task-card:hover,
.task-card:focus {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}

.task-hospital {
  font-size: 19px;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0;
  flex: 1;
}

.task-price {
  font-size: 24px;
  font-weight: 700;
  color: #d83a00;
  flex-shrink: 0;
}

.task-dept,
.task-caregiver {
  font-size: 16px;
  color: #4a4a4a;
  margin: 4px 0;
  line-height: 1.5;
}

.task-type {
  display: inline-block;
  margin-top: 10px;
  padding: 5px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #0066cc;
  background: #e6f0ff;
  border-radius: 20px;
}
</style>
