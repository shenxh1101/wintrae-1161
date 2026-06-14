export default defineAppConfig({
  pages: [
    'pages/photo/index',
    'pages/daily/index',
    'pages/reminder/index',
    'pages/report/index',
    'pages/family/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '慢病饮食助手',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F0FDF9'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#10B981',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/photo/index',
        text: '饮食拍照'
      },
      {
        pagePath: 'pages/daily/index',
        text: '每日记录'
      },
      {
        pagePath: 'pages/reminder/index',
        text: '提醒计划'
      },
      {
        pagePath: 'pages/report/index',
        text: '周报分析'
      },
      {
        pagePath: 'pages/family/index',
        text: '家属共享'
      }
    ]
  }
})
