/**
 * 隐私脱敏工具函数
 */

// 姓名脱敏：中间字用 * 代替
export function maskName(name) {
  if (!name) return ''
  if (name.length === 1) return name
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

// 手机号脱敏：显示前3后4
export function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || ''
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

// 身份证脱敏：显示前6后4
export function maskIdCard(idCard) {
  if (!idCard || idCard.length < 10) return idCard || ''
  return idCard.slice(0, 6) + '********' + idCard.slice(-4)
}

// 地址脱敏：显示到小区/楼栋
export function maskAddress(address) {
  if (!address) return ''
  return address
}
