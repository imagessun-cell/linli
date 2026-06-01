<template>
  <div class="publish">
    <div class="header">
      <h2>发布陪诊任务</h2>
      <p>选择子服务，精准匹配陪诊师</p>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <div class="sub-type-section">
        <div class="section-title">选择服务类型 <span class="required">*</span></div>
        <div class="sub-type-grid">
          <div
            v-for="sub in escortSubTypes"
            :key="sub.id"
            :class="['sub-type-card', { selected: form.sub_type === sub.id }]"
            @click="selectSubType(sub.id)"
          >
            <span class="sub-icon">{{ sub.icon }}</span>
            <span class="sub-name">{{ sub.name }}</span>
            <span class="sub-price">{{ sub.priceRange }}</span>
            <span class="sub-desc">{{ sub.desc }}</span>
            <span v-if="form.sub_type === sub.id" class="check-mark">✓</span>
          </div>
        </div>
      </div>

      <el-form-item label="就诊医院" prop="address">
        <el-input v-model="form.address" placeholder="请输入医院名称" />
      </el-form-item>

      <el-form-item label="科室">
        <el-input v-model="form.department" placeholder="请输入科室（如：呼吸科）" />
      </el-form-item>

      <el-form-item label="患者信息">
        <el-input v-model="form.patient_info" placeholder="如：张爷爷，78岁，行动不便（选填）" />
      </el-form-item>

      <el-form-item label="期望时间" prop="start_time">
        <el-date-picker v-model="form.start_time" type="datetime" placeholder="选择开始时间" style="width: 100%" />
      </el-form-item>

      <el-form-item label="结束时间" prop="end_time">
        <el-date-picker v-model="form.end_time" type="datetime" placeholder="选择结束时间" style="width: 100%" />
      </el-form-item>

      <el-form-item label="服务时长">
        <span>{{ duration }} 分钟</span>
      </el-form-item>

      <el-form-item label="体力要求" prop="physical_level">
        <el-radio-group v-model="form.physical_level">
          <el-radio :label="1">轻度</el-radio>
          <el-radio :label="2">中度</el-radio>
          <el-radio :label="3">重度</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="预算" prop="budget">
        <el-input v-model.number="form.budget" type="number" placeholder="输入预算金额">
          <template #prepend>¥</template>
        </el-input>
        <div class="price-hint" v-if="form.sub_type">
          建议价：{{ currentSubType?.priceRange }}
        </div>
      </el-form-item>

      <el-form-item label="特殊协助">
        <el-checkbox-group v-model="form.special_assist">
          <el-checkbox label="轮椅">轮椅协助</el-checkbox>
          <el-checkbox label="担架">担架协助</el-checkbox>
          <el-checkbox label="翻译">语言翻译</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.special_requirements" type="textarea" :rows="2" placeholder="其他特殊要求（选填）" />
      </el-form-item>

      <div class="insurance-badge">
        ✅ 已包含陪诊意外险
      </div>
    </el-form>

    <div class="actions">
      <el-button type="primary" size="large" :loading="loading" @click="handlePublish">
        确认发布并支付
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const router = useRouter()

const formRef = ref()
const loading = ref(false)

const escortSubTypes = [
  { id: 1, name: '全程陪同', icon: '👣', desc: '从出发到返家，全程陪伴完成就诊所有环节', priceRange: '80-120元/半天' },
  { id: 2, name: '挂号取药', icon: '💊', desc: '仅代为排队挂号、缴费、取药', priceRange: '30-50元/次' },
  { id: 3, name: '门诊陪护', icon: '🪑', desc: '诊室外候诊、检查、缴费环节提供陪伴', priceRange: '50-80元/次' },
  { id: 4, name: '代为问诊', icon: '📝', desc: '代替向医生描述病情、记录医嘱、取药', priceRange: '60-100元/次' }
]

const form = reactive({
  type: 1,
  sub_type: null,
  address: '',
  department: '',
  patient_info: '',
  start_time: '',
  end_time: '',
  physical_level: 1,
  budget: '',
  special_requirements: '',
  special_assist: [],
  is_charity: false
})

const currentSubType = computed(() => {
  return escortSubTypes.find(sub => sub.id === form.sub_type)
})

const selectSubType = (id) => {
  form.sub_type = id
  if (currentSubType.value) {
    ElMessage.info(`已选择「${currentSubType.value.name}」，建议报酬 ${currentSubType.value.priceRange}`)
  }
}

const rules = {
  sub_type: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  address: [{ required: true, message: '请输入医院名称', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  budget: [{ required: true, message: '请输入预算', trigger: 'blur' }]
}

const duration = computed(() => {
  if (!form.start_time || !form.end_time) return 0
  const start = new Date(form.start_time).getTime()
  const end = new Date(form.end_time).getTime()
  return Math.round((end - start) / 60000)
})

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toISOString()
}

watch(() => form.special_assist, (val) => {
  if (val.length > 0) {
    form.special_requirements = form.special_requirements
      ? form.special_requirements + ' | 需要：' + val.join('、')
      : '需要：' + val.join('、')
  }
})

const handlePublish = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (duration.value <= 0) {
        ElMessage.warning('结束时间必须晚于开始时间')
        return
      }
      loading.value = true
      try {
        const res = await request.post('/employer/tasks', {
          type: 1,
          sub_type: form.sub_type,
          address: form.address,
          department: form.department,
          patient_info: form.patient_info,
          start_time: formatTime(form.start_time),
          end_time: formatTime(form.end_time),
          duration_minutes: duration.value,
          physical_level: form.physical_level,
          budget: form.budget,
          special_requirements: form.special_requirements,
          is_charity: form.is_charity
        })
        if (res.code === 0) {
          ElMessage.success('任务发布成功')
          router.push('/employer/orders')
        }
      } catch (e) {
        ElMessage.error(e.message || '发布失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.publish {
  padding: 16px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.header p {
  color: #999;
  font-size: 14px;
}

.sub-type-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.section-title .required {
  color: #f56c6c;
}

.sub-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.sub-type-card {
  position: relative;
  padding: 14px 12px;
  border: 2px solid #dcdfe6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-type-card:hover {
  border-color: #409eff;
}

.sub-type-card.selected {
  border-color: #409eff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sub-icon {
  font-size: 24px;
}

.sub-name {
  font-size: 15px;
  font-weight: 600;
}

.sub-price {
  font-size: 12px;
  opacity: 0.9;
}

.sub-desc {
  font-size: 11px;
  opacity: 0.8;
  line-height: 1.3;
}

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: white;
  color: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.sub-type-card.selected .check-mark {
  background: rgba(255,255,255,0.3);
  color: white;
}

.price-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.insurance-badge {
  text-align: center;
  padding: 12px;
  background: #f0f9eb;
  color: #67c23a;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 14px;
}

.actions {
  margin-top: 20px;
}

.actions .el-button {
  width: 100%;
}
</style>