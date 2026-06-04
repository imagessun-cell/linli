// 设计系统统一出口
import AppButton from './components/AppButton.vue'
import AppCard from './components/AppCard.vue'
import AppTag from './components/AppTag.vue'
import AppChip from './components/AppChip.vue'
import AppField from './components/AppField.vue'
import AppSegmented from './components/AppSegmented.vue'
import AppAvatar from './components/AppAvatar.vue'
import AppDivider from './components/AppDivider.vue'
import AppEmpty from './components/AppEmpty.vue'
import AppNavBar from './components/AppNavBar.vue'
import AppTabBar from './components/AppTabBar.vue'
import AppListItem from './components/AppListItem.vue'
import AppSheet from './components/AppSheet.vue'
import AppSection from './components/AppSection.vue'

export {
  AppButton,
  AppCard,
  AppTag,
  AppChip,
  AppField,
  AppSegmented,
  AppAvatar,
  AppDivider,
  AppEmpty,
  AppNavBar,
  AppTabBar,
  AppListItem,
  AppSheet,
  AppSection
}

export default {
  install(app) {
    app.component('AppButton', AppButton)
    app.component('AppCard', AppCard)
    app.component('AppTag', AppTag)
    app.component('AppChip', AppChip)
    app.component('AppField', AppField)
    app.component('AppSegmented', AppSegmented)
    app.component('AppAvatar', AppAvatar)
    app.component('AppDivider', AppDivider)
    app.component('AppEmpty', AppEmpty)
    app.component('AppNavBar', AppNavBar)
    app.component('AppTabBar', AppTabBar)
    app.component('AppListItem', AppListItem)
    app.component('AppSheet', AppSheet)
    app.component('AppSection', AppSection)
  }
}
