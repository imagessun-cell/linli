<template>
  <div class="training">
    <div class="course-list">
      <div v-for="course in courses" :key="course.id" class="course-card" @click="goToCourse(course)">
        <div class="cover">
          <img :src="course.cover_url || '/default-cover.png'" />
          <span class="duration" v-if="course.duration_seconds">
            {{ formatDuration(course.duration_seconds) }}
          </span>
        </div>
        <div class="info">
          <h4>{{ course.title }}</h4>
          <div class="meta">
            <el-tag v-if="course.is_required" size="small" type="danger">必修</el-tag>
            <span class="progress" v-if="getProgress(course.id)">
              已学习 {{ getProgress(course.id).progress_percent }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="courses.length === 0 && !loading" description="暂无课程" />
    <el-loading v-if="loading" />

    <el-dialog v-model="showCourse" :title="currentCourse?.title" width="90%">
      <div class="video-player">
        <video v-if="currentCourse?.video_url" :src="currentCourse.video_url" controls style="width: 100%"></video>
        <p v-else class="no-video">暂无视频</p>
      </div>
      <div class="course-info">
        <p>{{ currentCourse?.title }}</p>
        <div class="progress-bar" v-if="currentCourse">
          <el-slider v-model="progress" :step="10" @change="updateProgress" />
          <span>学习进度: {{ progress }}%</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const courses = ref([])
const loading = ref(false)
const showCourse = ref(false)
const currentCourse = ref(null)
const progress = ref(0)
const records = ref({})

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

const getProgress = (courseId) => records.value[courseId]

const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await request.get('/training/courses')
    if (res.code === 0) {
      courses.value = res.data || []
    }

    const myRes = await request.get('/training/my-courses')
    if (myRes.code === 0) {
      const recordMap = {}
      ;(myRes.data || []).forEach(r => {
        recordMap[r.course_id] = r
      })
      records.value = recordMap
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const goToCourse = (course) => {
  currentCourse.value = course
  progress.value = records.value[course.id]?.progress_percent || 0
  showCourse.value = true
}

const updateProgress = async (val) => {
  if (!currentCourse.value) return
  try {
    await request.put(`/training/courses/${currentCourse.value.id}/progress`, {
      progress_percent: val,
      finished: val >= 100 ? 1 : 0
    })
    records.value[currentCourse.value.id] = { ...records.value[currentCourse.value.id], progress_percent: val }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchCourses()
})
</script>

<style scoped>
.training {
  padding: 0;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.cover {
  position: relative;
  height: 160px;
  background: #f0f0f0;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover .duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.info {
  padding: 12px;
}

.info h4 {
  font-size: 14px;
  margin-bottom: 8px;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress {
  font-size: 12px;
  color: #667eea;
}

.video-player {
  background: #000;
  margin-bottom: 16px;
}

.no-video {
  text-align: center;
  padding: 40px;
  color: #999;
}

.course-info p {
  font-size: 14px;
  color: #333;
  margin-bottom: 16px;
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar .el-slider {
  flex: 1;
}

.progress-bar span {
  font-size: 12px;
  color: #999;
}
</style>