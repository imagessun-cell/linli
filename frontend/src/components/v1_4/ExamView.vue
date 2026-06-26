<template>
  <div class="exam-view">
    <div v-if="examState === 'start'">
      <div class="exam-header">
        <h3>📝 陪诊师资格考试</h3>
        <p class="exam-desc">共 10 题，每题 10 分，80 分通过</p>
        <div class="exam-rules">
          <p>• 随机抽取 10 道题目</p>
          <p>• 涵盖服务规范、应急处理、隐私保护等</p>
          <p>• 不限时，可随时交卷</p>
        </div>
      </div>
      <el-button type="primary" size="large" @click="startExam" style="width: 100%;">
        开始考试
      </el-button>

      <!-- 历史记录 -->
      <div class="history-section" v-if="records.length > 0">
        <h4>考试记录</h4>
        <div v-for="r in records" :key="r.id" class="history-item">
          <span>{{ new Date(r.finished_at).toLocaleDateString() }}</span>
          <span :class="r.passed ? 'pass' : 'fail'">
            {{ r.score }}分 {{ r.passed ? '✅' : '❌' }}
          </span>
        </div>
      </div>
    </div>

    <div v-else-if="examState === 'doing'">
      <div class="exam-progress">
        <span>第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
        <span>{{ Math.round(((currentIndex + 1) / questions.length) * 100) }}%</span>
      </div>
      <el-progress :percentage="Math.round(((currentIndex + 1) / questions.length) * 100)" :stroke-width="6" />

      <div class="question-card">
        <p class="q-number">第 {{ currentIndex + 1 }} 题</p>
        <p class="q-text">{{ currentQuestion.question }}</p>

        <div class="options">
          <div
            v-for="(opt, i) in currentQuestion.options"
            :key="i"
            :class="['option-item', { selected: answers[currentQuestion.id] === letters[i] }]"
            @click="selectAnswer(letters[i])"
          >
            <span class="option-letter">{{ letters[i] }}</span>
            <span class="option-text">{{ opt }}</span>
          </div>
        </div>
      </div>

      <div class="exam-actions">
        <el-button @click="prevQuestion" :disabled="currentIndex === 0">上一题</el-button>
        <el-button v-if="currentIndex < questions.length - 1" type="primary" @click="nextQuestion">
          下一题
        </el-button>
        <el-button v-else type="success" @click="submitExam" :loading="submitting">
          交卷
        </el-button>
      </div>
    </div>

    <div v-else-if="examState === 'result'">
      <div class="result-card">
        <div class="result-icon">{{ result.passed ? '🎉' : '😅' }}</div>
        <h3>{{ result.passed ? '恭喜通过！' : '未通过' }}</h3>
        <div class="score-display">
          <span class="score-num">{{ result.score }}</span>
          <span class="score-unit">分</span>
        </div>
        <p class="result-detail">
          正确 {{ result.correctCount }} / {{ result.totalQuestions }} 题
        </p>
        <p class="result-passline" v-if="!result.passed">80 分通过，请再接再厉</p>

        <div class="result-review">
          <div
            v-for="(res, qId) in result.results"
            :key="qId"
            :class="['review-item', res.isCorrect ? 'correct' : 'wrong']"
          >
            <span>第 {{ Object.keys(result.results).indexOf(qId) + 1 }} 题</span>
            <span>{{ res.isCorrect ? '✓' : '✗' }} 选 {{ res.userAnswer }}</span>
          </div>
        </div>

        <div class="result-actions">
          <el-button v-if="!result.passed" type="primary" @click="startExam">重新考试</el-button>
          <el-button @click="$emit('close')">关闭</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close'])

const letters = ['A', 'B', 'C', 'D']

const examState = ref('start') // start | doing | result
const questions = ref([])
const currentIndex = ref(0)
const answers = ref({})
const submitting = ref(false)
const records = ref([])
const result = ref(null)

const currentQuestion = computed(() => questions.value[currentIndex.value])

const fetchRecords = async () => {
  try {
    const res = await request.get('/v1/exam/records')
    if (res.code === 0) {
      records.value = res.data
    }
  } catch (e) {
    // ignore
  }
}

const startExam = async () => {
  try {
    const res = await request.get('/v1/exam/questions')
    if (res.code === 0 && res.data.length > 0) {
      questions.value = res.data
      answers.value = {}
      currentIndex.value = 0
      examState.value = 'doing'
    } else {
      ElMessage.warning('暂无可用题目')
    }
  } catch (e) {
    ElMessage.error('获取题目失败')
  }
}

const selectAnswer = (letter) => {
  answers.value[currentQuestion.value.id] = letter
}

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const submitExam = async () => {
  // Check all answered
  const unanswered = questions.value.filter(q => !answers.value[q.id])
  if (unanswered.length > 0) {
    ElMessage.warning(`还有 ${unanswered.length} 道题未作答`)
    return
  }

  submitting.value = true
  try {
    const res = await request.post('/v1/exam/submit', { answers: answers.value })
    if (res.code === 0) {
      result.value = res.data
      examState.value = 'result'
      fetchRecords()
    }
  } catch (e) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.exam-view {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.exam-header {
  text-align: center;
  margin-bottom: 24px;
}

.exam-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.exam-desc {
  font-size: 14px;
  color: #7D6257;
  margin-bottom: 16px;
}

.exam-rules {
  background: #FFF9F2;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: left;
}

.exam-rules p {
  font-size: 13px;
  color: #7D6257;
  line-height: 2;
}

.exam-progress {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #8A6C60;
  margin-bottom: 8px;
}

.question-card {
  margin: 20px 0;
}

.q-number {
  font-size: 13px;
  color: #8A6C60;
  margin-bottom: 8px;
}

.q-text {
  font-size: 16px;
  font-weight: 500;
  color: #4F3A32;
  margin-bottom: 20px;
  line-height: 1.5;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #EFE2DC;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #E94F3D;
  background: #FFF0EC;
}

.option-item.selected {
  border-color: #E94F3D;
  background: #FFF0EC;
}

.option-letter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #FFF9F2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #7D6257;
}

.option-item.selected .option-letter {
  background: #E94F3D;
  color: white;
}

.option-text {
  font-size: 14px;
  color: #4F3A32;
  line-height: 1.4;
}

.exam-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.exam-actions .el-button {
  flex: 1;
}

.result-card {
  text-align: center;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 12px;
}

.result-card h3 {
  font-size: 20px;
  margin-bottom: 16px;
}

.score-display {
  margin-bottom: 8px;
}

.score-num {
  font-size: 56px;
  font-weight: 700;
  color: #E94F3D;
}

.score-unit {
  font-size: 20px;
  color: #8A6C60;
}

.result-detail {
  font-size: 14px;
  color: #7D6257;
  margin-bottom: 4px;
}

.result-passline {
  font-size: 13px;
  color: #C98216;
  margin-bottom: 20px;
}

.result-review {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  justify-content: center;
}

.review-item {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.review-item.correct {
  background: #FFF3D8;
  color: #B66A25;
}

.review-item.wrong {
  background: #F9E7E3;
  color: #B84545;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.result-actions .el-button {
  flex: 1;
}

.history-section {
  margin-top: 24px;
}

.history-section h4 {
  font-size: 14px;
  color: #8A6C60;
  margin-bottom: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid #EFE2DC;
}

.history-item .pass { color: #B66A25; }
.history-item .fail { color: #B84545; }
</style>
