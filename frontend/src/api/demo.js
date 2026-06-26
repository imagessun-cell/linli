const now = new Date()
const iso = (hoursFromNow = 0) => new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000).toISOString()

const ok = (data = {}, message = 'success') => Promise.resolve({ code: 0, message, data })

const demoUser = {
  id: 15,
  phone: '13900000001',
  nickname: '林阿姨',
  real_name: '林阿姨',
  age: 58,
  role: 2,
  avatar_url: '',
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

let tasks = taskSeed.map((item, index) => {
  const [address, hospital, type, subType, budget, duration, physicalLevel, distance, lat, lng, hospitalLat, hospitalLng, employer, community] = item
  const start = iso(24 + index * 3)
  const end = iso(24 + index * 3 + duration / 60)
  return {
    id: index + 1,
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
    employerAvatar: '',
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
  { id: 1, user_id: 21, nickname: '张阿姨', age: 56, community: '花家地社区', skills: '["全程陪同","挂号取药"]', service_periods: '["weekday_morning","weekend"]', total_orders: 62, service_hours: 188, avg_rating: 4.9, honor_level: '金牌', avatar_url: '', status: 1 },
  { id: 2, user_id: 22, nickname: '刘师傅', age: 60, community: '望京西园', skills: '["门诊陪护","代为问诊"]', service_periods: '["weekday_afternoon","weekend"]', total_orders: 44, service_hours: 136, avg_rating: 4.8, honor_level: '银牌', avatar_url: '', status: 1 },
  { id: 3, user_id: 23, nickname: '陈阿姨', age: 54, community: '安贞西里', skills: '["全程陪同","门诊陪护"]', service_periods: '["weekday_morning","weekday_afternoon"]', total_orders: 38, service_hours: 121, avg_rating: 4.9, honor_level: '金牌', avatar_url: '', status: 1 },
  { id: 4, user_id: 24, nickname: '王叔叔', age: 59, community: '和平里社区', skills: '["挂号取药","代为问诊"]', service_periods: '["weekend"]', total_orders: 31, service_hours: 96, avg_rating: 4.7, honor_level: '邻里优选', avatar_url: '', status: 1 }
]

let conversations = [
  { other_user_id: 21, other_nickname: '张阿姨', other_avatar: '', last_message: '明天我会提前十分钟到小区门口。', last_message_time: iso(-1), last_message_type: 1, unread_count: 1 },
  { other_user_id: 22, other_nickname: '刘师傅', other_avatar: '', last_message: '检查单拍照发我，我帮您看流程。', last_message_time: iso(-5), last_message_type: 1, unread_count: 0 }
]

let messages = [
  { id: 1, from_user_id: 21, to_user_id: 15, content: '您好，我看到您的陪诊需求了。', type: 1, created_at: iso(-2), from_nickname: '张阿姨', from_avatar: '' },
  { id: 2, from_user_id: 15, to_user_id: 21, content: '您好，老人行动比较慢，需要您多照看一下。', type: 1, created_at: iso(-1.9), from_nickname: '林阿姨', from_avatar: '' },
  { id: 3, from_user_id: 21, to_user_id: 15, content: '没问题，我会提前到，路线也已经看好了。', type: 1, created_at: iso(-1), from_nickname: '张阿姨', from_avatar: '' }
]

let orders = [
  { id: 1, task_id: 1, order_no: 'ORD20260626001', employer_id: 15, worker_id: 21, task_type: 1, address: '望京西园四区', start_time: iso(24), end_time: iso(25.5), worker_nickname: '张阿姨', worker_phone: '13800000001', employer_nickname: '林阿姨', employer_phone: '13900000001', total_amount: 140, platform_commission: 14, worker_income: 126, status: 2, created_at: iso(-20), special_requirements: '请提前十分钟到达，协助老人完成缴费。' },
  { id: 2, task_id: 2, order_no: 'ORD20260625003', employer_id: 15, worker_id: 22, task_type: 1, address: '花家地北里', start_time: iso(-24), end_time: iso(-22.5), worker_nickname: '刘师傅', worker_phone: '13800000002', employer_nickname: '林阿姨', employer_phone: '13900000001', total_amount: 120, platform_commission: 12, worker_income: 108, status: 4, created_at: iso(-48), special_requirements: '陪同复诊并记录医生建议。' }
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
  { id: 1, nickname: '张阿姨', avatar_url: '', content_type: 1, content_text: '今天陪同老人去做复查，提前把检查楼层和缴费窗口查好，老人安心很多。', image_urls: '', voice_url: '', like_count: 18, comment_count: 4, created_at: iso(-4) },
  { id: 2, nickname: '刘师傅', avatar_url: '', content_type: 1, content_text: '陪诊小经验：检查报告出来后先拍照留存，再帮家属整理成清单。', image_urls: '', voice_url: '', like_count: 12, comment_count: 2, created_at: iso(-28) }
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
  if (params.physicalLevel) {
    const levels = String(params.physicalLevel).split(',').map(Number)
    list = list.filter((task) => levels.includes(task.physicalLevel))
  }
  return list
}

const createOrderFromTask = (task, workerId = 21) => {
  const id = orders.length + 1
  const worker = workers.find((item) => item.user_id === Number(workerId)) || workers[0]
  const order = {
    id,
    task_id: task.id,
    order_no: `ORD${Date.now()}`,
    employer_id: demoUser.id,
    worker_id: worker.user_id,
    task_type: task.type || 1,
    address: task.address,
    start_time: task.startTime || task.start_time,
    end_time: task.endTime || task.end_time,
    worker_nickname: worker.nickname,
    worker_phone: '13800000001',
    employer_nickname: demoUser.nickname,
    employer_phone: demoUser.phone,
    total_amount: task.budget,
    platform_commission: Math.round(task.budget * 10) / 100,
    worker_income: Math.round(task.budget * 90) / 100,
    status: 1,
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
    if (url === '/employer/workers') return ok({ workers, total: workers.length })
    if (url === '/employer/orders' || url === '/worker/orders') {
      const params = paramsFrom(config)
      const status = params.status
      const filtered = status ? orders.filter((item) => String(item.status) === String(status)) : orders
      return ok({ orders: filtered, total: filtered.length })
    }
    if (url.startsWith('/order/')) {
      const id = Number(url.split('/')[2])
      return ok(orders.find((item) => item.id === id) || orders[0])
    }
    if (url === '/worker/wallet') return ok(wallet)
    if (url === '/worker/wallet/transactions') return ok(walletTransactions)
    if (url === '/message/list') return ok({ conversations })
    if (url.startsWith('/message/conversation/')) return ok(messages)
    if (url.startsWith('/user/profile/')) {
      const id = Number(url.split('/').pop())
      const worker = workers.find((item) => item.user_id === id)
      return ok(worker ? { id: worker.user_id, nickname: worker.nickname, avatar_url: worker.avatar_url, age: worker.age, community: worker.community } : demoUser)
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
    if (url === '/auth/realname') return ok({})
    if (url === '/employer/tasks') {
      const nextId = tasks.length + 1
      const subType = Number(data.sub_type || 1)
      const task = normalizeTask({
        id: nextId,
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
      createOrderFromTask(task)
      return ok({}, '接单成功')
    }
    if (url === '/message/send') {
      const message = { id: messages.length + 1, from_user_id: demoUser.id, to_user_id: Number(data.to_user_id), content: data.content, type: 1, created_at: iso(0), from_nickname: demoUser.nickname, from_avatar: '' }
      messages.push(message)
      return ok(message)
    }
    if (url === '/community/posts') {
      const post = { id: posts.length + 1, nickname: demoUser.nickname, avatar_url: '', content_type: 1, content_text: data.content_text, image_urls: '', voice_url: '', like_count: 0, comment_count: 0, created_at: iso(0) }
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
    if (url === '/v1/agreement/sign' || url === '/v1/exam/submit' || url === '/v1/complaint' || url === '/v1/sos' || url.includes('/checkpoint') || url.includes('/pre-history') || url.includes('/service-report')) return ok({})
    return ok({})
  },
  put(url) {
    if (url === '/auth/switch-role') return ok({ token: 'demo-token', role: demoUser.role })
    if (url.includes('/start')) {
      const id = Number(url.split('/').find((part) => /^\d+$/.test(part)))
      const order = orders.find((item) => item.id === id)
      if (order) order.status = 2
      return ok({ insurance_no: `INS${Date.now()}` })
    }
    if (url.includes('/complete') || url.includes('/confirm')) {
      const id = Number(url.split('/').find((part) => /^\d+$/.test(part)))
      const order = orders.find((item) => item.id === id)
      if (order) order.status = 4
      return ok({})
    }
    if (url.includes('/cancel')) return ok({})
    return ok({})
  },
  delete() {
    return ok({})
  }
})
