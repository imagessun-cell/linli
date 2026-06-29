const now = new Date()
const iso = (hoursFromNow = 0) => new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000).toISOString()

const ok = (data = {}, message = 'success') => Promise.resolve({ code: 0, message, data })
const demoAsset = (path) => `${import.meta.env.BASE_URL || '/'}${path.replace(/^\//, '')}`

const avatars = {
  currentUser: demoAsset('/img/Avatar/KuaPai_AI_20260602114803.png'),
  patients: [
    demoAsset('/img/Avatar/KuaPai_AI_20260602114540.png'),
    demoAsset('/img/Avatar/KuaPai_AI_20260602114655.png'),
    demoAsset('/img/Avatar/KuaPai_AI_20260602114745.png'),
    demoAsset('/img/Avatar/KuaPai_AI_20260602114703.png'),
    demoAsset('/img/Avatar/KuaPai_AI_20260602114803.png')
  ],
  workers: [
    demoAsset('/img/Avatar/KuaPai_AI_20260602114309.png'),
    demoAsset('/img/Avatar/KuaPai_AI_20260602113400.jpeg'),
    demoAsset('/img/Avatar/KuaPai_AI_20260602113549.jpeg'),
    demoAsset('/img/Avatar/KuaPai_AI_20260602114344.png'),
    demoAsset('/img/Avatar/KuaPai_AI_20260602113622.jpeg')
  ]
}

const demoUser = {
  id: 15,
  phone: '13900000001',
  nickname: '林阿姨',
  real_name: '林阿姨',
  age: 58,
  role: 2,
  avatar_url: avatars.currentUser,
  community: '朝阳区花家地社区',
  worker: {
    id: 3,
    user_id: 15,
    age: 58,
    community: '朝阳区花家地社区',
    service_radius: 3000,
    skills: '["全程陪同","挂号取药","门诊陪护"]',
    service_periods: '["weekday_morning","weekday_afternoon","weekend"]',
    total_orders: 38,
    completed_tasks: 38,
    service_hours: 124,
    avg_rating: 4.9,
    rating: 4.9,
    total_earnings: 2688,
    honor_level: '金牌邻里陪诊师',
    status: 1
  },
  employer: {
    id: 6,
    user_id: 15,
    age: 58,
    community: '朝阳区花家地社区',
    credit_score: 116,
    published_tasks: 7
  }
}

const taskSeed = [
  ['望京西园四区', '北京中医药大学东方医院', 1, 1, 140, 90, 1, 680, 116.477, 39.995, 116.434, 39.966, '李阿姨', '望京街道'],
  ['花家地北里', '中日友好医院', 1, 3, 120, 75, 2, 930, 116.469, 39.982, 116.424, 39.971, '周叔叔', '花家地社区'],
  ['劲松一区', '北京协和医院东单院区', 1, 2, 160, 120, 1, 1200, 116.461, 39.884, 116.414, 39.912, '陈阿姨', '劲松街道'],
  ['双井富力城', '北京医院', 1, 4, 180, 110, 1, 2600, 116.459, 39.894, 116.414, 39.907, '王叔叔', '双井社区'],
  ['和平里七区', '北京积水潭医院新街口院区', 1, 1, 150, 100, 2, 4200, 116.421, 39.959, 116.368, 39.94, '赵阿姨', '和平里社区'],
  ['北苑家园清友园', '航空总医院', 1, 2, 100, 65, 1, 3500, 116.43, 40.04, 116.414, 40.048, '孙叔叔', '北苑社区'],
  ['酒仙桥南路小区', '首都医科大学附属北京朝阳医院', 1, 3, 130, 80, 2, 1800, 116.494, 39.973, 116.455, 39.921, '郭阿姨', '酒仙桥社区'],
  ['安贞西里', '安贞医院', 1, 1, 120, 85, 1, 2100, 116.397, 39.97, 116.397, 39.976, '马叔叔', '安贞社区']
]

const subTypeMeta = {
  1: { name: '全程陪同', icon: '👣' },
  2: { name: '挂号取药', icon: '💊' },
  3: { name: '门诊陪护', icon: '🪑' },
  4: { name: '代为问诊', icon: '📝' }
}

const orderStatusNames = { 1: '待服务', 2: '服务中', 3: '待确认', 4: '已完成', 5: '已取消', 6: '退款中', 7: '待报价', 8: '待支付' }

const servicePriceMeta = {
  full: { key: 'full', subType: 1, name: '全程陪同', price: 168, minutes: 180, durationText: '约3小时' },
  medicine: { key: 'medicine', subType: 2, name: '挂号取药', price: 68, minutes: 60, durationText: '约1小时' },
  clinic: { key: 'clinic', subType: 3, name: '门诊陪护', price: 128, minutes: 120, durationText: '约2小时' },
  consult: { key: 'consult', subType: 4, name: '代为问诊', price: 98, minutes: 90, durationText: '约1.5小时' }
}

const serviceKeyBySubType = { 1: 'full', 2: 'medicine', 3: 'clinic', 4: 'consult' }

const resolveServiceOption = (data = {}, task = {}) => {
  const subType = Number(task.subType || task.sub_type || data.sub_type || 1)
  const key = data.service_type || serviceKeyBySubType[subType] || 'full'
  const meta = servicePriceMeta[key] || servicePriceMeta.full
  const price = Number(data.service_price || task.budget || meta.price)
  const minutes = Number(data.duration_minutes || task.duration || task.duration_minutes || meta.minutes)
  return {
    ...meta,
    key,
    subType: Number(data.sub_type || meta.subType || subType),
    name: data.service_name || task.subTypeName || task.sub_type_name || meta.name,
    price,
    minutes,
    durationText: data.service_duration || meta.durationText
  }
}

let tasks = taskSeed.map((item, index) => {
  const [address, hospital, type, subType, budget, duration, physicalLevel, distance, lat, lng, hospitalLat, hospitalLng, employer, community] = item
  const start = iso(24 + index * 3)
  const end = iso(24 + index * 3 + duration / 60)
  return {
    id: index + 1,
    employerId: 31 + index,
    employer_id: 31 + index,
    type,
    typeName: '全程陪同',
    typeIcon: '👣',
    subType,
    subTypeName: subTypeMeta[subType].name,
    subTypeIcon: subTypeMeta[subType].icon,
    title: `${address} → ${hospital}`,
    startTime: start,
    endTime: end,
    start_time: start,
    end_time: end,
    duration,
    duration_minutes: duration,
    address,
    latitude: lat,
    longitude: lng,
    distance,
    physicalLevel,
    physical_level: physicalLevel,
    physicalLevelName: physicalLevel === 1 ? '轻度' : '中度',
    physicalLevelColor: physicalLevel === 1 ? '#52c41a' : '#faad14',
    budget,
    isCharity: 0,
    specialRequirements: index % 2 ? '需要协助排队缴费，服务结束后帮忙整理医嘱。' : '就诊人走路较慢，请提前十分钟到达并耐心陪同。',
    special_requirements: index % 2 ? '需要协助排队缴费，服务结束后帮忙整理医嘱。' : '就诊人走路较慢，请提前十分钟到达并耐心陪同。',
    employerNickname: employer,
    employer_nickname: employer,
    employerAvatar: avatars.patients[index % avatars.patients.length],
    employer_avatar: avatars.patients[index % avatars.patients.length],
    employerCommunity: community,
    targetHospital: hospital,
    target_hospital: hospital,
    targetHospitalLat: hospitalLat,
    targetHospitalLng: hospitalLng,
    target_hospital_lat: hospitalLat,
    target_hospital_lng: hospitalLng,
    status: 0,
    createdAt: iso(-index - 1),
    created_at: iso(-index - 1)
  }
})

const workers = [
  { id: 1, user_id: 21, nickname: '张阿姨', age: 56, community: '花家地社区', skills: '["全程陪同","挂号取药"]', service_periods: '["weekday_morning","weekend"]', total_orders: 62, service_hours: 188, total_hours: 188, distance_km: 0.8, avg_rating: 4.9, honor_level: '金牌', avatar_url: avatars.workers[0], status: 1 },
  { id: 2, user_id: 22, nickname: '刘师傅', age: 60, community: '望京西园', skills: '["门诊陪护","代为问诊"]', service_periods: '["weekday_afternoon","weekend"]', total_orders: 44, service_hours: 136, total_hours: 136, distance_km: 1.4, avg_rating: 4.8, honor_level: '银牌', avatar_url: avatars.workers[1], status: 1 },
  { id: 3, user_id: 23, nickname: '陈阿姨', age: 54, community: '安贞西里', skills: '["全程陪同","门诊陪护"]', service_periods: '["weekday_morning","weekday_afternoon"]', total_orders: 38, service_hours: 121, total_hours: 121, distance_km: 2.1, avg_rating: 4.9, honor_level: '金牌', avatar_url: avatars.workers[2], status: 1 },
  { id: 4, user_id: 24, nickname: '王叔叔', age: 59, community: '和平里社区', skills: '["挂号取药","代为问诊"]', service_periods: '["weekend"]', total_orders: 31, service_hours: 96, total_hours: 96, distance_km: 2.7, avg_rating: 4.7, honor_level: '邻里优选', avatar_url: avatars.workers[3], status: 1 }
]

let conversations = [
  { other_user_id: 21, other_nickname: '张阿姨', other_avatar: avatars.workers[0], last_message: '明天我会提前十分钟到小区门口。', last_message_time: iso(-1), last_message_type: 1, unread_count: 1 },
  { other_user_id: 22, other_nickname: '刘师傅', other_avatar: avatars.workers[1], last_message: '检查单拍照发我，我帮您看流程。', last_message_time: iso(-5), last_message_type: 1, unread_count: 0 }
]

let messages = [
  { id: 1, from_user_id: 21, to_user_id: 15, content: '您好，我看到您的陪诊需求了。', type: 1, created_at: iso(-2), from_nickname: '张阿姨', from_avatar: avatars.workers[0] },
  { id: 2, from_user_id: 15, to_user_id: 21, content: '您好，老人行动比较慢，需要您多照看一下。', type: 1, created_at: iso(-1.9), from_nickname: '林阿姨', from_avatar: avatars.currentUser },
  { id: 3, from_user_id: 21, to_user_id: 15, content: '没问题，我会提前到，路线也已经看好了。', type: 1, created_at: iso(-1), from_nickname: '张阿姨', from_avatar: avatars.workers[0] }
]

let orders = [
  { id: 1, task_id: 1, order_no: 'ORD20260626001', employer_id: 15, worker_id: 21, task_type: 1, service_name: '全程陪同', address: '望京西园四区', target_hospital: '北京中医药大学东方医院', start_time: iso(24), end_time: iso(25.5), duration_minutes: 90, worker_nickname: '张阿姨', worker_phone: '13800000001', employer_nickname: '林阿姨', employer_phone: '13900000001', total_amount: 140, platform_commission: 14, worker_income: 126, status: 2, order_status_text: '服务中', payment_status: 'paid', created_at: iso(-20), special_requirements: '请提前十分钟到达，协助老人完成缴费。' },
  { id: 2, task_id: 2, order_no: 'ORD20260625003', employer_id: 15, worker_id: 22, task_type: 3, service_name: '门诊陪护', address: '花家地北里', target_hospital: '中日友好医院', start_time: iso(-24), end_time: iso(-22.5), duration_minutes: 90, worker_nickname: '刘师傅', worker_phone: '13800000002', employer_nickname: '林阿姨', employer_phone: '13900000001', total_amount: 120, platform_commission: 12, worker_income: 108, status: 4, order_status_text: '已完成', payment_status: 'paid', created_at: iso(-48), special_requirements: '陪同复诊并记录医生建议。' },
  { id: 3, task_id: 1003, order_no: 'ORD20260629007', employer_id: 13, worker_id: 15, task_type: 1, service_name: '全程陪同', address: '和平里七区', target_hospital: '北京积水潭医院新街口院区', start_time: iso(22), end_time: iso(25), duration_minutes: 180, worker_nickname: '林阿姨', worker_phone: '13900000001', employer_nickname: '赵阿姨', employer_phone: '13900000003', total_amount: 168, platform_commission: 16.8, worker_income: 151.2, status: 7, order_status_text: '待报价', payment_status: 'pending_quote', created_at: iso(-1.2), special_requirements: '就诊人腰腿不便，需要陪同候诊、缴费并整理医嘱。', quote_note: '请陪诊师根据路线和服务要求确认最终报价。' },
  { id: 4, task_id: 1004, order_no: 'ORD20260629008', employer_id: 15, worker_id: 23, task_type: 1, service_name: '全程陪同', address: '朝阳区花家地社区', target_hospital: '中日友好医院', start_time: iso(30), end_time: iso(33), duration_minutes: 180, worker_nickname: '陈阿姨', worker_phone: '13800000003', employer_nickname: '林阿姨', employer_phone: '13900000001', total_amount: 188, platform_commission: 18.8, worker_income: 169.2, status: 8, order_status_text: '待支付', payment_status: 'pending_payment', created_at: iso(-0.8), special_requirements: '需要提前到小区门口接人，协助排队检查并提醒复诊安排。', quote_note: '已包含三小时全程陪同、院内排队协助和医嘱整理。' }
]

let preHistoryRecords = [
  { id: 1, order_id: 1, patient_name: '林阿姨', patient_age: '58', medical_history: '高血压，规律服药。', allergy_history: '青霉素过敏。', current_symptoms: '近期头晕，需要复诊确认用药。', medication_info: '每日晨服降压药。', other_info: '走路较慢，请预留排队时间。', screenshot_url: '', confirmed_at: iso(-6) }
]

let serviceReports = [
  { id: 1, order_id: 2, doctor_advice: '按医嘱继续服药，两周后复查。', medication_reminder: '早晚饭后服药，注意监测血压。', next_visit_date: iso(24 * 14), photo_urls: '[]', notes: '已将处方和缴费票据整理给就诊人。', submitted_at: iso(-20) }
]

let wallet = {
  id: 1,
  worker_id: 3,
  cash_balance: 328.5,
  frozen_balance: 40,
  total_income: 2688,
  withdrawable_balance: 288.5
}

let walletTransactions = [
  { id: 1, wallet_id: 1, type: 1, amount: 126, order_id: 1, status: 1, created_at: iso(-20) },
  { id: 2, wallet_id: 1, type: 4, amount: 100, order_id: null, status: 1, created_at: iso(-60) },
  { id: 3, wallet_id: 1, type: 2, amount: 80, order_id: null, status: 1, created_at: iso(-90) }
]

let posts = [
  { id: 1, nickname: '张阿姨', avatar_url: avatars.workers[0], content_type: 1, content_text: '今天陪同老人去做复查，提前把检查楼层和缴费窗口查好，老人安心很多。', image_urls: '', voice_url: '', like_count: 18, comment_count: 4, created_at: iso(-4) },
  { id: 2, nickname: '刘师傅', avatar_url: avatars.workers[1], content_type: 1, content_text: '陪诊小经验：检查报告出来后先拍照留存，再帮家属整理成清单。', image_urls: '', voice_url: '', like_count: 12, comment_count: 2, created_at: iso(-28) }
]

const normalizeTask = (task) => ({
  ...task,
  startTime: task.startTime || task.start_time,
  endTime: task.endTime || task.end_time,
  duration: task.duration || task.duration_minutes,
  subType: task.subType || task.sub_type,
  subTypeName: task.subTypeName || subTypeMeta[task.sub_type]?.name,
  subTypeIcon: task.subTypeIcon || subTypeMeta[task.sub_type]?.icon,
  physicalLevel: task.physicalLevel || task.physical_level,
  physicalLevelName: task.physicalLevelName || (task.physical_level === 2 ? '中度' : '轻度'),
  employerNickname: task.employerNickname || task.employer_nickname,
  employerCommunity: task.employerCommunity || '邻里社区',
  employerId: task.employerId || task.employer_id || demoUser.id,
  employer_id: task.employer_id || task.employerId || demoUser.id,
  targetHospital: task.targetHospital || task.target_hospital,
  targetHospitalLat: task.targetHospitalLat || task.target_hospital_lat,
  targetHospitalLng: task.targetHospitalLng || task.target_hospital_lng,
  createdAt: task.createdAt || task.created_at,
  typeName: task.typeName || '全程陪同',
  typeIcon: task.typeIcon || '👣'
})

const paramsFrom = (config = {}) => config?.params || config || {}

const filterTasks = (config) => {
  const params = paramsFrom(config)
  const keyword = String(params.keyword || '').trim()
  let list = tasks.map(normalizeTask)
  if (keyword) {
    list = list.filter((task) => [task.address, task.targetHospital, task.subTypeName, task.specialRequirements].some((text) => String(text || '').includes(keyword)))
  }
  if (params.type) {
    const types = String(params.type).split(',').map(Number)
    list = list.filter((task) => types.includes(task.type))
  }
  if (params.subType) {
    const subTypes = String(params.subType).split(',').map(Number)
    list = list.filter((task) => subTypes.includes(task.subType))
  }
  if (params.physicalLevel) {
    const levels = String(params.physicalLevel).split(',').map(Number)
    list = list.filter((task) => levels.includes(task.physicalLevel))
  }
  return list
}

const filterWorkers = (config) => {
  const params = paramsFrom(config)
  const keyword = String(params.keyword || '').trim()
  const skill = String(params.skills || '').trim()
  let list = [...workers]
  if (skill) {
    list = list.filter((worker) => String(worker.skills || '').includes(skill))
  }
  if (keyword) {
    list = list.filter((worker) => [worker.nickname, worker.community, worker.skills].some((text) => String(text || '').includes(keyword)))
  }
  return list
}

const getConversationMessages = (targetId) => {
  return messages.filter((msg) => {
    return (msg.from_user_id === demoUser.id && msg.to_user_id === targetId) ||
      (msg.from_user_id === targetId && msg.to_user_id === demoUser.id)
  })
}

const upsertConversation = (targetId, lastMessage) => {
  let conv = conversations.find((item) => item.other_user_id === targetId)
  if (!conv) {
    const worker = workers.find((item) => item.user_id === targetId)
    const taskOwner = tasks.find((item) => item.employerId === targetId || item.employer_id === targetId)
    conv = {
      other_user_id: targetId,
      other_nickname: worker?.nickname || taskOwner?.employerNickname || '联系人',
      other_avatar: worker?.avatar_url || taskOwner?.employerAvatar || avatars.currentUser,
      last_message: '',
      last_message_time: iso(0),
      last_message_type: 1,
      unread_count: 0
    }
    conversations.unshift(conv)
  }
  conv.last_message = lastMessage.type === 3 ? `订单动态：${lastMessage.order_status_text || '状态已更新'}` : lastMessage.content
  conv.last_message_time = lastMessage.created_at
  conv.last_message_type = lastMessage.type || 1
  return conv
}

const getOrderChatTarget = (order, senderId = demoUser.id) => {
  return Number(senderId) === Number(order.worker_id) ? Number(order.employer_id) : Number(order.worker_id)
}

const pushOrderDynamic = (order, statusText, options = {}) => {
  const targetId = Number(options.targetId || getOrderChatTarget(order, options.senderId || demoUser.id))
  const senderId = Number(options.senderId || demoUser.id)
  const senderWorker = workers.find((item) => item.user_id === senderId)
  const serviceName = order.service_name || subTypeMeta[order.task_type]?.name || '陪诊服务'
  const message = {
    id: messages.length + 1,
    from_user_id: senderId,
    to_user_id: targetId,
    content: `[订单动态] ${serviceName} · ${statusText}`,
    type: 3,
    order_id: order.id,
    order_no: order.order_no,
    order_status: order.status,
    order_status_text: statusText,
    order_amount: order.total_amount,
    service_name: serviceName,
    created_at: iso(0),
    from_nickname: options.senderName || senderWorker?.nickname || demoUser.nickname,
    from_avatar: options.senderAvatar || senderWorker?.avatar_url || demoUser.avatar_url
  }
  messages.push(message)
  const otherId = senderId === demoUser.id ? targetId : (targetId === demoUser.id ? senderId : targetId)
  upsertConversation(otherId, message)
  return message
}

const createOrderFromTask = (task, workerId = demoUser.id, options = {}) => {
  const id = orders.length + 1
  const worker = workers.find((item) => item.user_id === Number(workerId)) ||
    (Number(workerId) === demoUser.id
      ? { user_id: demoUser.id, nickname: demoUser.nickname, avatar_url: demoUser.avatar_url }
      : workers[0])
  const service = resolveServiceOption(options, task)
  const amount = Number(options.total_amount || service.price || task.budget || 0)
  const status = Number(options.status || 1)
  const employerId = Number(options.employerId || task.employerId || task.employer_id || demoUser.id)
  const order = {
    id,
    task_id: task.id,
    order_no: `ORD${Date.now()}`,
    employer_id: employerId,
    worker_id: worker.user_id,
    task_type: service.subType,
    service_key: service.key,
    service_name: service.name,
    address: task.address,
    target_hospital: task.targetHospital || task.target_hospital || '目标医院待确认',
    start_time: task.startTime || task.start_time,
    end_time: task.endTime || task.end_time,
    duration_minutes: service.minutes || task.duration || task.duration_minutes,
    worker_nickname: worker.nickname,
    worker_phone: '13800000001',
    employer_nickname: task.employerNickname || task.employer_nickname || demoUser.nickname,
    employer_phone: demoUser.phone,
    total_amount: amount,
    platform_commission: Math.round(amount * 10) / 100,
    worker_income: Math.round(amount * 90) / 100,
    status,
    order_status_text: orderStatusNames[status] || '待服务',
    payment_status: options.payment_status || (status === 1 ? 'paid' : 'unpaid'),
    quote_note: options.quote_note || '',
    created_at: iso(0),
    special_requirements: task.specialRequirements || task.special_requirements || ''
  }
  orders.unshift(order)
  return order
}

export const isDemoMode = import.meta.env.VITE_LINLI_DEMO === '1'

export const createDemoRequest = () => ({
  get(url, config = {}) {
    if (url === '/auth/profile') return ok(demoUser)
    if (url === '/task/nearby') {
      const list = filterTasks(config)
      return ok({ list, total: list.length, page: 1, pageSize: list.length, hasMore: false })
    }
    if (url === '/task/suggestions') {
      return ok({
        suggestions: [
          { text: '中日友好医院', type: 'address' },
          { text: '挂号取药', type: 'subType' },
          { text: '花家地社区', type: 'keyword' }
        ],
        hotKeywords: ['中日友好医院', '全程陪同', '挂号取药', '行动不便']
      })
    }
    if (url.startsWith('/task/public/')) {
      const id = Number(url.split('/').pop())
      return ok(normalizeTask(tasks.find((task) => task.id === id) || tasks[0]))
    }
    if (url.startsWith('/task/')) {
      const id = Number(url.split('/')[2])
      return ok(normalizeTask(tasks.find((task) => task.id === id) || tasks[0]))
    }
    if (url === '/employer/workers') {
      const list = filterWorkers(config)
      return ok({ workers: list, total: list.length })
    }
    if (url === '/employer/orders' || url === '/worker/orders') {
      const params = paramsFrom(config)
      const status = params.status
      const scopedOrders = url === '/worker/orders'
        ? orders.filter((item) => Number(item.worker_id) === Number(demoUser.id))
        : orders.filter((item) => Number(item.employer_id) === Number(demoUser.id))
      const filtered = status ? scopedOrders.filter((item) => String(item.status) === String(status)) : scopedOrders
      const sorted = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return ok({ orders: sorted, total: sorted.length })
    }
    if (url.startsWith('/order/')) {
      const id = Number(url.split('/')[2])
      return ok(orders.find((item) => item.id === id) || orders[0])
    }
    if (url === '/worker/wallet') return ok(wallet)
    if (url === '/worker/wallet/transactions') return ok(walletTransactions)
    if (url === '/message/list') return ok({ conversations })
    if (url.startsWith('/message/conversation/')) {
      const targetId = Number(url.split('/').pop())
      const conv = conversations.find((item) => item.other_user_id === targetId)
      if (conv) conv.unread_count = 0
      return ok(getConversationMessages(targetId))
    }
    if (url.startsWith('/user/profile/')) {
      const id = Number(url.split('/').pop())
      const worker = workers.find((item) => item.user_id === id)
      const taskOwner = tasks.find((item) => item.employerId === id || item.employer_id === id)
      if (worker) return ok({ id: worker.user_id, nickname: worker.nickname, avatar_url: worker.avatar_url, age: worker.age, community: worker.community })
      if (taskOwner) return ok({ id, nickname: taskOwner.employerNickname, avatar_url: taskOwner.employerAvatar, age: 68, community: taskOwner.employerCommunity })
      return ok(demoUser)
    }
    if (url === '/community/posts') return ok({ posts })
    if (url === '/v1/agreement/check/publish') return ok({ signed: true })
    if (url === '/v1/certification') return ok({ level: '金牌', total_orders: 38, avg_rating: 4.9 })
    if (url === '/v1/exam/records') return ok([])
    if (url === '/v1/exam/questions') {
      return ok([
        { id: 1, question: '陪诊服务中，以下哪项属于隐私保护要求？', options: ['公开患者信息', '不得向第三方透露患者病情', '随意讨论病情', '发布案例'], answer: 'B' }
      ])
    }
    if (url.includes('/checkpoints')) {
      return ok({
        progress: [
          { key: 'arrive', name: '到达就诊人地点', done: true, record: { created_at: iso(-1) } },
          { key: 'hospital', name: '到达医院', done: true, record: { created_at: iso(-0.5) } },
          { key: 'finish', name: '完成陪诊', done: false }
        ]
      })
    }
    if (/^\/v1\/orders\/\d+\/pre-history$/.test(url)) {
      const id = Number(url.split('/')[3])
      return ok(preHistoryRecords.find((item) => Number(item.order_id) === id) || null)
    }
    if (/^\/v1\/orders\/\d+\/service-report$/.test(url)) {
      const id = Number(url.split('/')[3])
      return ok(serviceReports.find((item) => Number(item.order_id) === id) || null)
    }
    if (url === '/location/ip') return ok({ latitude: 39.98, longitude: 116.46 })
    if (url === '/location/convert') return ok({ latitude: 39.98, longitude: 116.46, lat: 39.98, lng: 116.46 })
    if (url === '/location/geocode') {
      const params = paramsFrom(config)
      return ok({ name: params.address || '演示地点', lat: 39.98, lng: 116.46, latitude: 39.98, longitude: 116.46 })
    }
    if (url.startsWith('/admin/')) return ok({ users: [], tasks: [], types: [], total: 0 })
    return ok({})
  },
  post(url, data = {}) {
    if (url === '/auth/login' || url === '/auth/register') return ok({ token: 'demo-token', user: demoUser })
    if (url === '/auth/realname') {
      demoUser.real_name = data.real_name || demoUser.real_name
      demoUser.face_verified = 1
      return ok({})
    }
    if (/^\/employer\/workers\/\d+\/invite$/.test(url)) {
      const workerId = Number(url.split('/')[3])
      const worker = workers.find((item) => item.user_id === workerId) || workers[0]
      const service = resolveServiceOption(data)
      const nextId = tasks.length + 1
      const start = iso(24)
      const end = iso(24 + service.minutes / 60)
      const task = normalizeTask({
        id: nextId,
        employerId: demoUser.id,
        employer_id: demoUser.id,
        worker_id: worker.user_id,
        type: 1,
        sub_type: service.subType,
        subType: service.subType,
        address: data.address || data.patient_location || demoUser.community || '花家地北里',
        target_hospital: data.target_hospital || '就近医院待确认',
        targetHospital: data.target_hospital || '就近医院待确认',
        latitude: data.latitude || 39.982,
        longitude: data.longitude || 116.469,
        target_hospital_lat: data.target_hospital_lat || 39.971,
        target_hospital_lng: data.target_hospital_lng || 116.424,
        start_time: start,
        end_time: end,
        duration_minutes: service.minutes,
        budget: service.price,
        physical_level: 1,
        distance: 860,
        employer_nickname: demoUser.nickname,
        employerCommunity: demoUser.community,
        special_requirements: data.special_requirements || `${service.name}需求已提交，等待陪诊师确认报价。`,
        status: 7,
        created_at: iso(0)
      })
      tasks.unshift(task)
      demoUser.employer.published_tasks += 1
      const order = createOrderFromTask(task, worker.user_id, {
        service_type: service.key,
        service_name: service.name,
        service_price: service.price,
        service_duration: service.durationText,
        status: 7,
        payment_status: 'pending_quote',
        quote_note: '等待陪诊师根据路线和要求确认最终报价'
      })
      const message = pushOrderDynamic(order, '就诊人已补充路线和要求，等待陪诊师报价')
      return ok({ order, order_id: order.id, message_id: message.id }, '需求已提交，等待陪诊师报价')
    }
    if (url === '/employer/tasks') {
      const nextId = tasks.length + 1
      const subType = Number(data.sub_type || 1)
      const task = normalizeTask({
        id: nextId,
        employerId: demoUser.id,
        employer_id: demoUser.id,
        type: 1,
        sub_type: subType,
        subType,
        address: data.address || '花家地北里',
        target_hospital: data.target_hospital || '中日友好医院',
        targetHospital: data.target_hospital || '中日友好医院',
        latitude: data.latitude || 39.982,
        longitude: data.longitude || 116.469,
        target_hospital_lat: data.target_hospital_lat || 39.971,
        target_hospital_lng: data.target_hospital_lng || 116.424,
        start_time: data.start_time,
        end_time: data.end_time,
        duration_minutes: data.duration_minutes,
        budget: data.budget || 100,
        physical_level: data.physical_level || 1,
        distance: 880,
        employer_nickname: demoUser.nickname,
        employerCommunity: demoUser.community,
        special_requirements: data.special_requirements || '',
        status: 0,
        created_at: iso(0)
      })
      tasks.unshift(task)
      return ok({ task_id: nextId }, '任务发布成功')
    }
    if (url === '/worker/apply') {
      demoUser.worker = { ...demoUser.worker, ...data, status: 1 }
      return ok({}, '认证申请已提交')
    }
    if (url.includes('/grab') || url.includes('/accept')) {
      const id = Number(url.split('/').find((part) => /^\d+$/.test(part)))
      const task = tasks.find((item) => item.id === id) || tasks[0]
      task.status = 1
      task.worker_id = demoUser.id
      const order = createOrderFromTask(task, demoUser.id, { status: 1 })
      demoUser.worker.total_orders += 1
      pushOrderDynamic(order, '陪诊师已接单，订单待服务', {
        senderId: demoUser.id,
        targetId: order.employer_id,
        senderName: demoUser.nickname,
        senderAvatar: demoUser.avatar_url
      })
      return ok({ order, order_id: order.id }, '接单成功')
    }
    if (url === '/message/send') {
      const message = { id: messages.length + 1, from_user_id: demoUser.id, to_user_id: Number(data.to_user_id), content: data.content, type: 1, created_at: iso(0), from_nickname: demoUser.nickname, from_avatar: demoUser.avatar_url }
      messages.push(message)
      upsertConversation(Number(data.to_user_id), message)
      return ok(message)
    }
    if (/^\/order\/\d+\/review$/.test(url)) {
      const id = Number(url.split('/')[2])
      const order = orders.find((item) => item.id === id)
      if (order) order.review = { ...data, submitted_at: iso(0) }
      return ok({ ...data, submitted_at: iso(0) }, '评价已提交')
    }
    if (/^\/worker\/orders\/\d+\/quote$/.test(url)) {
      const id = Number(url.split('/')[3])
      const order = orders.find((item) => item.id === id)
      if (order) {
        const amount = Math.max(1, Number(data.amount || order.total_amount || 0))
        order.total_amount = amount
        order.platform_commission = Math.round(amount * 10) / 100
        order.worker_income = Math.round(amount * 90) / 100
        order.status = 8
        order.payment_status = 'pending_payment'
        order.quote_note = data.quote_note || ''
        order.order_status_text = orderStatusNames[8]
        pushOrderDynamic(order, `陪诊师已报价 ¥${amount}，等待就诊人支付`, {
          senderId: order.worker_id,
          targetId: order.employer_id,
          senderName: order.worker_nickname
        })
      }
      return ok(order || {}, '报价已发送')
    }
    if (/^\/employer\/orders\/\d+\/pay$/.test(url)) {
      const id = Number(url.split('/')[3])
      const order = orders.find((item) => item.id === id)
      if (order) {
        order.status = 1
        order.payment_status = 'paid'
        order.order_status_text = orderStatusNames[1]
        pushOrderDynamic(order, '就诊人已付款，订单进入待服务', {
          senderId: order.employer_id,
          targetId: order.worker_id,
          senderName: order.employer_nickname
        })
      }
      return ok(order || {}, '支付成功')
    }
    if (/^\/v1\/orders\/\d+\/pre-history$/.test(url)) {
      const id = Number(url.split('/')[3])
      const record = { ...(preHistoryRecords.find((item) => Number(item.order_id) === id) || {}), ...data, id: preHistoryRecords.length + 1, order_id: id, confirmed_at: iso(0) }
      preHistoryRecords = preHistoryRecords.filter((item) => Number(item.order_id) !== id)
      preHistoryRecords.unshift(record)
      return ok(record, '病史资料已保存')
    }
    if (/^\/v1\/orders\/\d+\/service-report$/.test(url)) {
      const id = Number(url.split('/')[3])
      const report = { ...(serviceReports.find((item) => Number(item.order_id) === id) || {}), ...data, id: serviceReports.length + 1, order_id: id, submitted_at: iso(0) }
      serviceReports = serviceReports.filter((item) => Number(item.order_id) !== id)
      serviceReports.unshift(report)
      return ok(report, '服务报告已保存')
    }
    if (url === '/community/posts') {
      const post = { id: posts.length + 1, nickname: demoUser.nickname, avatar_url: demoUser.avatar_url, content_type: 1, content_text: data.content_text, image_urls: '', voice_url: '', like_count: 0, comment_count: 0, created_at: iso(0) }
      posts.unshift(post)
      return ok(post)
    }
    if (url.includes('/like')) return ok({})
    if (url === '/worker/wallet/recharge') {
      const amount = Number(data.amount || 0)
      wallet.cash_balance += amount
      wallet.withdrawable_balance += amount
      walletTransactions.unshift({ id: walletTransactions.length + 1, wallet_id: 1, type: 4, amount, status: 1, created_at: iso(0) })
      return ok(wallet)
    }
    if (url === '/worker/wallet/withdraw') {
      const amount = Number(data.amount || 0)
      wallet.cash_balance -= amount
      wallet.withdrawable_balance -= amount
      walletTransactions.unshift({ id: walletTransactions.length + 1, wallet_id: 1, type: 2, amount, status: 1, created_at: iso(0) })
      return ok(wallet)
    }
    if (url === '/v1/agreement/sign' || url === '/v1/exam/submit' || url === '/v1/complaint' || url === '/v1/sos' || url.includes('/checkpoint')) return ok({})
    return ok({})
  },
  put(url, data = {}) {
    if (url === '/auth/switch-role') {
      demoUser.role = Number(data.role || demoUser.role)
      return ok({ token: 'demo-token', role: demoUser.role })
    }
    if (url.includes('/start')) {
      const id = Number(url.split('/').find((part) => /^\d+$/.test(part)))
      const order = orders.find((item) => item.id === id)
      if (order) {
        order.status = 2
        order.order_status_text = orderStatusNames[2]
        pushOrderDynamic(order, '服务已开始，陪诊师正在陪同就诊', {
          senderId: order.worker_id,
          targetId: order.employer_id,
          senderName: order.worker_nickname
        })
      }
      return ok({ insurance_no: `INS${Date.now()}` })
    }
    if (url.includes('/complete')) {
      const id = Number(url.split('/').find((part) => /^\d+$/.test(part)))
      const order = orders.find((item) => item.id === id)
      if (order) {
        order.status = 3
        order.order_status_text = orderStatusNames[3]
        pushOrderDynamic(order, '陪诊师已提交完成，等待就诊人确认', {
          senderId: order.worker_id,
          targetId: order.employer_id,
          senderName: order.worker_nickname
        })
      }
      return ok({})
    }
    if (url.includes('/confirm')) {
      const id = Number(url.split('/').find((part) => /^\d+$/.test(part)))
      const order = orders.find((item) => item.id === id)
      if (order) {
        order.status = 4
        order.order_status_text = orderStatusNames[4]
        pushOrderDynamic(order, '就诊人已确认完成，服务结束', {
          senderId: order.employer_id,
          targetId: order.worker_id,
          senderName: order.employer_nickname
        })
      }
      return ok({})
    }
    if (url.includes('/cancel')) {
      const id = Number(url.split('/').find((part) => /^\d+$/.test(part)))
      const order = orders.find((item) => item.id === id || item.task_id === id)
      if (order) {
        order.status = 5
        order.order_status_text = orderStatusNames[5]
        pushOrderDynamic(order, '订单已取消', {
          senderId: demoUser.id,
          targetId: getOrderChatTarget(order)
        })
      }
      return ok({})
    }
    return ok({})
  },
  delete() {
    return ok({})
  }
})
