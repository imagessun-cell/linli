<template>
  <div class="wallet">
    <div class="balance-card">
      <p class="label">账户余额 (元)</p>
      <p class="balance">{{ wallet?.cash_balance || 0 }}</p>
      <p class="frozen" v-if="wallet?.frozen_amount > 0">冻结金额: ¥{{ wallet.frozen_amount }}</p>
    </div>

    <div class="stats">
      <div class="stat-item">
        <span class="value">{{ wallet?.points_balance || 0 }}</span>
        <span class="label">积分</span>
      </div>
    </div>

    <div class="actions">
      <el-button type="primary" size="large" @click="showRecharge = true">充值</el-button>
      <el-button type="primary" size="large" @click="showWithdraw = true">提现</el-button>
    </div>

    <div class="section">
      <h3>交易记录</h3>
      <div class="transaction-list">
        <div v-for="tx in transactions" :key="tx.id" class="tx-item">
          <div class="tx-info">
            <span class="tx-type">{{ txTypeNames[tx.type] }}</span>
            <span class="tx-date">{{ formatDate(tx.created_at) }}</span>
          </div>
          <span class="tx-amount" :class="[1, 4].includes(tx.type) ? 'income' : 'expense'">
            {{ [1, 4].includes(tx.type) ? '+' : '-' }}¥{{ tx.amount }}
          </span>
        </div>
      </div>
      <el-empty v-if="transactions.length === 0" description="暂无交易记录" />
    </div>

    <el-dialog v-model="showWithdraw" title="提现" width="90%">
      <el-form :model="withdrawForm" label-width="80px">
        <el-form-item label="提现金额">
          <el-input v-model="withdrawForm.amount" type="number" placeholder="请输入提现金额" />
        </el-form-item>
        <el-form-item label="可提现">
          <span>¥{{ wallet?.cash_balance || 0 }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWithdraw = false">取消</el-button>
        <el-button type="primary" @click="handleWithdraw" :loading="withdrawLoading">确认提现</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRecharge" title="充值" width="90%">
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="充值金额">
          <el-input v-model="rechargeForm.amount" type="number" placeholder="请输入充值金额" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecharge = false">取消</el-button>
        <el-button type="primary" @click="handleRecharge" :loading="rechargeLoading">确认充值</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const wallet = ref(null)
const transactions = ref([])
const showWithdraw = ref(false)
const showRecharge = ref(false)
const withdrawLoading = ref(false)
const rechargeLoading = ref(false)
const withdrawForm = ref({ amount: '' })
const rechargeForm = ref({ amount: '' })

const txTypeNames = { 1: '服务收入', 2: '提现', 3: '积分兑换', 4: '充值' }

const formatDate = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const fetchWallet = async () => {
  try {
    const res = await request.get('/worker/wallet')
    if (res.code === 0) {
      wallet.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchTransactions = async () => {
  try {
    const res = await request.get('/worker/wallet/transactions')
    if (res.code === 0) {
      transactions.value = res.data || []
    }
  } catch (e) {
    console.error(e)
  }
}

const refreshWallet = () => {
  fetchWallet()
  fetchTransactions()
}

const handleRecharge = async () => {
  const amount = Number(rechargeForm.value.amount)
  if (!amount || amount <= 0) {
    ElMessage.warning('请输入正确的金额')
    return
  }
  rechargeLoading.value = true
  try {
    const res = await request.post('/worker/wallet/recharge', { amount })
    if (res.code === 0) {
      ElMessage.success('充值成功')
      showRecharge.value = false
      rechargeForm.value.amount = ''
      refreshWallet()
    }
  } catch (e) {
    ElMessage.error(e.message || '充值失败')
  } finally {
    rechargeLoading.value = false
  }
}

const handleWithdraw = async () => {
  if (!withdrawForm.value.amount || withdrawForm.value.amount <= 0) {
    ElMessage.warning('请输入正确的金额')
    return
  }
  withdrawLoading.value = true
  try {
    const res = await request.post('/worker/wallet/withdraw', { amount: Number(withdrawForm.value.amount) })
    if (res.code === 0) {
      ElMessage.success('提现申请已提交')
      showWithdraw.value = false
      withdrawForm.value.amount = ''
      refreshWallet()
    }
  } catch (e) {
    ElMessage.error(e.message || '提现失败')
  } finally {
    withdrawLoading.value = false
  }
}

onMounted(() => {
  refreshWallet()
})
</script>

<style scoped>
.wallet {
  padding: 16px;
}

.balance-card {
  background: linear-gradient(135deg, #E94F3D 0%, #F6A21A 100%);
  color: white;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  margin-bottom: 20px;
}

.balance-card .label {
  font-size: 14px;
  opacity: 0.8;
}

.balance-card .balance {
  font-size: 40px;
  font-weight: bold;
  margin: 10px 0;
}

.balance-card .frozen {
  font-size: 12px;
  opacity: 0.7;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-item .value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #E94F3D;
}

.stat-item .label {
  font-size: 12px;
  color: #8A6C60;
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.actions .el-button {
  width: 100%;
  margin-left: 0 !important;
}

.section h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.transaction-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #F2E6DE;
}

.tx-item:last-child {
  border-bottom: none;
}

.tx-info {
  display: flex;
  flex-direction: column;
}

.tx-type {
  font-size: 14px;
  color: #4F3A32;
}

.tx-date {
  font-size: 12px;
  color: #8A6C60;
}

.tx-amount {
  font-size: 16px;
  font-weight: bold;
}

.tx-amount.income { color: #B66A25; }
.tx-amount.expense { color: #B84545; }

:deep(.el-dialog .el-input__wrapper) {
  border: 1px solid var(--line) !important;
  border-radius: 14px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

:deep(.el-dialog .el-input__wrapper.is-focus) {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 4px rgba(217, 74, 55, 0.08) !important;
}

:deep(.el-dialog .el-input__inner) {
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}
</style>
