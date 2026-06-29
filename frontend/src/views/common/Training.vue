<template>
  <div class="training-page">
    <section class="training-hero">
      <div class="hero-top">
        <button class="hero-back" type="button" aria-label="返回" @click="handleBack">‹</button>
        <span>{{ activeGuide ? activeGuide.category : '陪诊师训练营' }}</span>
      </div>
      <h1>{{ activeGuide ? activeGuide.title : '线上培训' }}</h1>
      <p>{{ activeGuide ? activeGuide.summary : '按医院真实动线拆解，从出发前核对到送达复盘，每一步都能照着执行。' }}</p>
      <div v-if="activeGuide" class="article-tags" aria-label="培训重点">
        <span v-for="tag in activeGuide.tags" :key="tag">{{ tag }}</span>
      </div>
    </section>

    <template v-if="!activeGuide">
      <main class="guide-list" aria-label="培训目录">
        <button
          v-for="guide in trainingGuides"
          :key="guide.id"
          class="guide-card"
          type="button"
          @click="openGuide(guide.id)"
        >
          <LinliProcessIllustration class="guide-cover" :type="guide.cover" :label="guide.title" />
          <span class="guide-copy">
            <strong>{{ guide.title }}</strong>
            <span>{{ guide.summary }}</span>
            <em>{{ guide.steps.length }} 个流程</em>
          </span>
          <span class="guide-arrow" aria-hidden="true">›</span>
        </button>
      </main>
    </template>

    <article v-else class="article-page">
      <section class="flow-chart-card" aria-label="陪诊流程图表">
        <div class="flow-card-title">
          <h2>流程总览</h2>
          <span>{{ activeGuide.steps.length }} 步闭环</span>
        </div>
        <div class="flow-chart" role="list">
          <div
            v-for="(step, index) in activeGuide.steps"
            :key="step.title"
            class="flow-node"
            role="listitem"
          >
            <span class="chart-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <LinliProcessIllustration class="chart-icon" :type="step.type" :label="step.title" />
            <strong>{{ step.title }}</strong>
          </div>
        </div>
      </section>

      <section class="flow-table-card" aria-label="陪诊流程表格">
        <div class="flow-card-title">
          <h2>执行清单</h2>
          <span>照表执行</span>
        </div>
        <div class="flow-table-wrap">
          <table class="flow-table">
            <thead>
              <tr>
                <th>流程</th>
                <th>关键目标</th>
                <th>现场动作</th>
                <th>交付物</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(step, index) in activeGuide.steps" :key="step.title">
                <td>
                  <span class="table-step-no">{{ String(index + 1).padStart(2, '0') }}</span>
                  <strong>{{ step.title }}</strong>
                </td>
                <td>
                  <span
                    v-for="phrase in toVisualPhrases(step.body).slice(0, 2)"
                    :key="phrase"
                    class="table-pill"
                  >
                    {{ phrase }}
                  </span>
                </td>
                <td>
                  <ul>
                    <li v-for="point in step.points" :key="point">{{ point }}</li>
                  </ul>
                </td>
                <td>{{ getStepDeliverable(step.type) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="flow-list compact-flow-list" aria-label="流程图文提示">
        <div
          v-for="(step, index) in activeGuide.steps"
          :key="step.title"
          class="flow-step"
        >
          <div class="step-card-head">
            <span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="step-title-block">
              <h2>{{ step.title }}</h2>
              <span>{{ activeGuide.category }}</span>
            </div>
            <LinliProcessIllustration class="step-visual" :type="step.type" :label="step.title" />
          </div>
          <div class="step-section">
            <span class="step-section-label">流程重点</span>
            <div class="step-summary" aria-label="流程重点">
              <span
                v-for="phrase in toVisualPhrases(step.body)"
                :key="phrase"
                class="summary-pill"
              >
                {{ phrase }}
              </span>
            </div>
          </div>
          <div class="step-section">
            <span class="step-section-label">执行动作</span>
            <div class="step-action-grid" aria-label="执行动作">
              <div
                v-for="(point, pointIndex) in step.points"
                :key="point"
                class="step-action-card"
              >
                <em>{{ pointIndex + 1 }}</em>
                <strong>{{ point }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="training-note">
        <h2>现场口径</h2>
        <div class="note-grid" aria-label="现场口径要点">
          <span v-for="(note, index) in siteNoteCards" :key="note">
            <em>{{ String(index + 1).padStart(2, '0') }}</em>
            <strong>{{ note }}</strong>
          </span>
        </div>
      </section>
    </article>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import LinliProcessIllustration from '@/components/LinliProcessIllustration.vue'

const router = useRouter()
const activeGuideId = ref('')

const trainingGuides = [
  {
    id: 'general',
    title: '大型综合医院门诊陪诊',
    category: '三甲综合医院常见动线',
    cover: 'arrive',
    summary: '适用于内科、外科、眼科等常规门诊，从取号到取药形成闭环。',
    tags: ['门诊大厅', '分诊候诊', '问诊检查', '取药复盘'],
    steps: [
      {
        type: 'prepare',
        title: '出发前核对资料',
        body: '提前确认就诊人姓名、身份证、医保卡、病历本、检查报告和过敏史，避免到院后反复补材料。',
        points: ['把医院、科室、预约时段发给就诊人或家属确认', '提醒携带身份证、医保卡、既往报告和常用药清单']
      },
      {
        type: 'arrive',
        title: '到院会合与取号',
        body: '在门诊大厅、医院正门或约定楼层会合，先确认人证一致，再去自助机或窗口取号。',
        points: ['老年就诊人优先选择容易识别的位置会合', '取号后拍照留存排队号码和候诊区域']
      },
      {
        type: 'triage',
        title: '分诊签到与候诊',
        body: '多数大型医院需要先到分诊台或候诊区二次签到，陪诊师要盯住叫号屏和语音播报。',
        points: ['确认科室楼层、诊区和诊室号', '候诊时间较长时协助如厕、饮水和休息']
      },
      {
        type: 'consult',
        title: '陪同问诊记录医嘱',
        body: '进入诊室后协助就诊人表达主要症状、既往病史和用药情况，重点记录医生后续安排。',
        points: ['不替就诊人回答病情判断题，只做补充说明', '记录检查项目、复诊时间、用药方法和注意事项']
      },
      {
        type: 'pay',
        title: '缴费与检查动线',
        body: '根据医生开的单据，协助在手机、自助机或人工窗口缴费，再按楼层指引前往检验、影像或功能检查区。',
        points: ['先问清检查是否需要空腹、憋尿或禁食', '保留缴费凭证、检查单和排队号码']
      },
      {
        type: 'pharmacy',
        title: '取药与报告整理',
        body: '药房取药后逐项核对姓名、药名、数量和服用方法；检查报告可在自助机、公众号或窗口领取。',
        points: ['药袋、报告、发票分开放入资料袋', '重要医嘱用文字同步给家属，避免口头遗漏']
      },
      {
        type: 'record',
        title: '送达与服务复盘',
        body: '陪同就诊人离院、打车或回到约定地点后，整理本次就诊结果和下一步事项。',
        points: ['同步本次花费、检查项目、药品和复诊安排', '确认就诊人安全到达后再结束服务']
      }
    ]
  },
  {
    id: 'followup',
    title: '复诊与慢病开药流程',
    category: '复诊开方场景',
    cover: 'record',
    summary: '适用于高血压、糖尿病、术后复查等需要带既往资料的复诊。',
    tags: ['资料整理', '复诊签到', '医嘱转述', '下次预约'],
    steps: [
      {
        type: 'prepare',
        title: '前一日整理复诊资料',
        body: '复诊最怕报告缺失。陪诊师需提前让就诊人把病历、上次处方、检查报告和近期指标放到同一袋内。',
        points: ['按时间顺序整理报告，最新报告放最上面', '慢病开药需确认医保卡、剩余药量和常用剂量']
      },
      {
        type: 'arrive',
        title: '到院签到与复诊排队',
        body: '复诊通常直接到专科诊区签到，但部分医院仍需门诊大厅取号，先按预约短信或医院公众号确认入口。',
        points: ['记录诊室号和预计候诊人数', '行动不便者优先寻找电梯、无障碍通道和休息座椅']
      },
      {
        type: 'consult',
        title: '协助医生了解近期变化',
        body: '协助就诊人向医生说明近期症状、指标变化、服药反应和不舒服的时间点。',
        points: ['把血压、血糖等记录按日期递给医生查看', '医生调整药量时当场复述一遍，确认无误']
      },
      {
        type: 'pay',
        title: '结算处方与治疗项目',
        body: '复诊结束后按医生开具项目完成缴费，涉及治疗预约时确认日期、地点和是否需要家属陪同。',
        points: ['医保结算后核对自费金额', '治疗或检查预约单拍照同步给家属']
      },
      {
        type: 'pharmacy',
        title: '取药并讲清用药节奏',
        body: '药房取药后按早中晚、饭前饭后、疗程长短归纳给就诊人，不自行解释药理。',
        points: ['同名不同规格药品要二次核对', '提醒按医生要求复查，不建议自行停药']
      },
      {
        type: 'record',
        title: '记录下次复诊时间',
        body: '把下次复诊、复查项目、是否空腹、是否停药等事项整理成一条清晰消息发给就诊人或家属。',
        points: ['标明具体日期、科室、楼层和注意事项', '把纸质资料放回资料袋并提醒保管']
      }
    ]
  },
  {
    id: 'inspection',
    title: '检查检验陪诊流程',
    category: '影像与检验场景',
    cover: 'check',
    summary: '适用于抽血、B超、CT、核磁、胃肠镜等多科室流转场景。',
    tags: ['预约登记', '检查禁忌', '跨楼层动线', '报告领取'],
    steps: [
      {
        type: 'prepare',
        title: '确认检查要求',
        body: '检查前先确认是否空腹、憋尿、停药、摘金属物，特殊检查要核对知情同意和家属陪同要求。',
        points: ['把检查单、预约短信和缴费状态核对一遍', '不确定事项直接问检查科室窗口']
      },
      {
        type: 'pay',
        title: '登记缴费与窗口排队',
        body: '到院后先完成缴费和登记，部分检查需要先到登记台换取排队号或预约确认单。',
        points: ['保留排队号，听从窗口叫号', '行动慢的就诊人提前预留跨楼层时间']
      },
      {
        type: 'triage',
        title: '候检提醒与状态照看',
        body: '候检期间持续观察就诊人状态，提醒饮水、禁食、憋尿或排空等检查准备要求。',
        points: ['需要家属签字时提前联系家属', '检查前确认姓名和项目，避免走错窗口']
      },
      {
        type: 'check',
        title: '陪同完成检查',
        body: '进入检查区前保管随身物品，检查结束后协助就诊人坐起、穿戴、休息并确认有无不适。',
        points: ['CT、核磁等检查留意金属物和禁忌提示', '胃肠镜等检查后不要立即独自离院']
      },
      {
        type: 'record',
        title: '领取报告与回诊',
        body: '根据医院规则在自助机、公众号或窗口领取报告，若医生要求回诊，要按原科室流程再次候诊。',
        points: ['报告拍照备份，原件放入资料袋', '发现危急值提示时立即联系医生或导诊台']
      },
      {
        type: 'pharmacy',
        title: '结束交接',
        body: '检查结束后将报告领取方式、预计出报告时间和下一步就医安排同步给就诊人或家属。',
        points: ['把未出报告项目列清楚', '确认就诊人返程方式和安全状态']
      }
    ]
  }
]

const activeGuide = computed(() => {
  return trainingGuides.find(guide => guide.id === activeGuideId.value)
})

const siteNoteCards = ['先看大厅导诊牌', '向导医台确认差异', '医嘱只记录并转述', '不替医生做判断']

const deliverableMap = {
  prepare: '资料确认清单',
  arrive: '会合地点与取号信息',
  triage: '诊区、诊室与候诊状态',
  consult: '医嘱、检查、复诊安排',
  pay: '缴费凭证与检查路线',
  check: '检查完成状态与不适反馈',
  pharmacy: '药品、报告与用药提醒',
  record: '服务复盘与安全到达确认'
}

const toVisualPhrases = (body = '') => {
  return body
    .split(/[，。；]/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 3)
}

const getStepDeliverable = (type) => deliverableMap[type] || '现场结果同步'

const openGuide = (id) => {
  activeGuideId.value = id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleBack = () => {
  if (activeGuideId.value) {
    activeGuideId.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  router.back()
}
</script>

<style scoped>
.training-page {
  min-height: 100vh;
  padding: 0 14px calc(104px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #FFF7EF 0%, #FFF9F2 42%, #FFF6EE 100%);
  color: #4F3A32;
}

.training-hero {
  margin: 0 -14px 14px;
  padding: 18px 16px 22px;
  background: #E94F3D;
  color: #fff;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-back {
  width: 42px;
  height: 42px;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.24) !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.12) !important;
  color: #fff !important;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
}

.hero-top span {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: #f8e1bd;
  color: #5f3b15;
  font-size: 14px;
  line-height: 1.2;
  font-weight: 900;
}

.training-hero h1 {
  margin: 12px 0 8px;
  color: #fff;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 900;
}

.training-hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  line-height: 1.55;
  font-weight: 800;
}

.training-top {
  min-height: 52px;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 8px;
}

.back-btn {
  width: 48px;
  height: 48px;
  min-height: 48px;
  padding: 0;
  border-radius: 50% !important;
  background: #fff !important;
  border: 1px solid #EBD8CF !important;
  color: #E94F3D !important;
  box-shadow: 0 6px 16px rgba(23, 35, 49, 0.06);
}

.back-btn span {
  display: block;
  transform: translateY(-1px);
  font-size: 34px;
  line-height: 1;
}

.training-brand {
  justify-self: center;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #E94F3D;
  font-size: 18px;
  font-weight: 900;
}

.training-intro,
.article-hero {
  margin-top: 8px;
  padding: 16px;
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.08);
}

.intro-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  color: #E94F3D;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 900;
}

.training-intro h1,
.article-hero h1 {
  margin: 0;
  color: #4F3A32;
  font-size: 28px;
  line-height: 1.18;
  font-weight: 900;
}

.training-intro p,
.article-hero p {
  margin: 10px 0 0;
  color: #8A6C60;
  font-size: 16px;
  line-height: 1.55;
  font-weight: 800;
}

.guide-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.guide-card {
  width: 100%;
  min-height: 120px;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #EBD8CF !important;
  border-radius: 18px !important;
  background: #fff !important;
  color: #4F3A32 !important;
  text-align: left;
  box-shadow: 0 8px 20px rgba(23, 35, 49, 0.06);
}

.guide-card:hover {
  border-color: #F2B5A7 !important;
  background: #fff !important;
}

.guide-cover {
  width: 96px;
}

.guide-copy {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.guide-copy strong {
  color: #4F3A32;
  font-size: 20px;
  line-height: 1.28;
  font-weight: 900;
}

.guide-copy span {
  color: #8A6C60;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 800;
}

.guide-copy em {
  justify-self: start;
  padding: 4px 8px;
  border-radius: 999px;
  background: #FFF0EC;
  color: #E94F3D;
  font-size: 12px;
  line-height: 1.2;
  font-style: normal;
  font-weight: 900;
}

.guide-arrow {
  color: #E94F3D;
  font-size: 34px;
  line-height: 1;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.article-tags span {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 13px;
  font-weight: 900;
}

.flow-chart-card,
.flow-table-card {
  margin-top: 14px;
  padding: 16px;
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 10px 24px rgba(64, 48, 40, 0.06);
}

.flow-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.flow-card-title h2 {
  margin: 0;
  color: #4F3A32;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 900;
}

.flow-card-title span {
  flex-shrink: 0;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  background: #FFF0EC;
  color: #D94A37;
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
}

.flow-chart {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.flow-node {
  position: relative;
  min-width: 0;
  min-height: 112px;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  align-items: center;
  gap: 6px 8px;
  padding: 10px;
  border: 1px solid #F0E3DD;
  border-radius: 16px;
  background: #FFFCF8;
}

.chart-index {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FFF0EC;
  color: #D94A37;
  font-size: 12px;
  font-weight: 900;
}

.chart-icon {
  width: 56px;
  justify-self: end;
}

.flow-node strong {
  grid-column: 1 / -1;
  color: #4F3A32;
  font-size: 14px;
  line-height: 1.3;
  font-weight: 900;
}

.flow-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #F0E3DD;
  border-radius: 16px;
  background: #FFFCF8;
}

.flow-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  table-layout: fixed;
}

.flow-table th,
.flow-table td {
  padding: 12px;
  border-bottom: 1px solid #F0E3DD;
  border-right: 1px solid #F0E3DD;
  vertical-align: top;
  text-align: left;
}

.flow-table th:last-child,
.flow-table td:last-child {
  border-right: none;
}

.flow-table tbody tr:last-child td {
  border-bottom: none;
}

.flow-table th {
  background: #FFF7F4;
  color: #7D6257;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 900;
}

.flow-table td {
  color: #5F4A42;
  font-size: 13px;
  line-height: 1.45;
  font-weight: 700;
}

.flow-table td:first-child {
  width: 132px;
}

.flow-table td:first-child strong {
  display: block;
  margin-top: 6px;
  color: #4F3A32;
  font-size: 14px;
  line-height: 1.35;
  font-weight: 900;
}

.table-step-no,
.table-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-style: normal;
  font-weight: 900;
}

.table-step-no {
  min-height: 26px;
  padding: 3px 8px;
  background: #FFF0EC;
  color: #D94A37;
  font-size: 12px;
}

.table-pill {
  max-width: 100%;
  min-height: 26px;
  margin: 0 5px 6px 0;
  padding: 4px 8px;
  background: #FFF7E6;
  color: #8A5A1D;
  font-size: 12px;
  line-height: 1.25;
}

.flow-table ul {
  margin: 0;
  padding-left: 17px;
}

.flow-table li + li {
  margin-top: 5px;
}

.flow-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.compact-flow-list {
  gap: 10px;
}

.compact-flow-list .flow-step {
  padding: 12px;
  box-shadow: none;
}

.compact-flow-list .step-card-head {
  grid-template-columns: 38px minmax(0, 1fr) 46px;
}

.compact-flow-list .step-number {
  width: 38px;
  height: 38px;
  font-size: 12px;
}

.compact-flow-list .step-title-block h2 {
  font-size: 17px;
}

.compact-flow-list .step-title-block span,
.compact-flow-list .step-section-label,
.compact-flow-list .summary-pill,
.compact-flow-list .step-action-card strong {
  font-size: 12px;
}

.compact-flow-list .step-visual {
  width: 46px;
  flex-basis: 46px;
}

.flow-step {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.08);
}

.step-card-head {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 62px;
  align-items: center;
  gap: 12px;
}

.step-number {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #E94F3D;
  color: #fff;
  font-size: 15px;
  font-weight: 900;
}

.step-title-block {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.step-title-block h2 {
  margin: 0;
  color: #4F3A32;
  font-size: 21px;
  line-height: 1.25;
  font-weight: 900;
}

.step-title-block span {
  color: #8A6C60;
  font-size: 13px;
  line-height: 1.25;
  font-weight: 900;
}

.step-visual {
  width: 62px;
  flex: 0 0 62px;
  margin: 0;
}

.step-section {
  display: grid;
  gap: 8px;
}

.step-section-label {
  justify-self: start;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  background: #FFF7E6;
  color: #B66A25;
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
}

.step-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.summary-pill {
  max-width: 100%;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: #FFF0EC;
  color: #E94F3D;
  font-size: 13px;
  line-height: 1.25;
  font-weight: 900;
  word-break: break-word;
}

.step-action-grid {
  display: grid;
  gap: 8px;
  margin-top: 0;
}

.step-action-card {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  padding: 10px;
  border: 1px solid #F2E6DE;
  border-radius: 14px;
  background: #FFFDF8;
}

.step-action-card em {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FFF7E6;
  color: #B66A25;
  font-size: 13px;
  line-height: 1;
  font-style: normal;
  font-weight: 900;
}

.step-action-card strong {
  min-width: 0;
  color: #6D5146;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 900;
}

.training-note {
  margin-top: 14px;
  padding: 16px;
  border: 1px solid #ead8bd;
  border-radius: 18px;
  background: #fff7ec;
}

.training-note h2 {
  margin: 0 0 8px;
  color: #7d4c20;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 900;
}

.note-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.note-grid span {
  min-width: 0;
  min-height: 74px;
  display: grid;
  align-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 14px;
  background: #fffdf8;
  border: 1px solid #ead8bd;
}

.note-grid em {
  color: #B66A25;
  font-size: 12px;
  line-height: 1;
  font-style: normal;
  font-weight: 900;
}

.note-grid strong {
  color: #6a563f;
  font-size: 14px;
  line-height: 1.35;
  font-weight: 900;
}

@media (max-width: 390px) {
  .guide-card {
    grid-template-columns: 82px minmax(0, 1fr) auto;
  }

  .guide-cover {
    width: 82px;
  }

  .flow-step {
    padding: 12px;
  }

  .step-card-head {
    grid-template-columns: 42px minmax(0, 1fr) 56px;
    gap: 10px;
  }

  .step-number {
    width: 42px;
    height: 42px;
  }

  .step-visual {
    width: 56px;
    flex-basis: 56px;
  }

  .note-grid {
    grid-template-columns: 1fr;
  }

  .flow-chart {
    grid-template-columns: 1fr;
  }

  .flow-chart-card,
  .flow-table-card {
    padding: 12px;
  }
}
</style>
