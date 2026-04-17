<template>
  <s-layout class="chat-wrap" navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
    <view class="fixed-header" :style="{ height: sheep.$platform.navbar + 'px' }">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view
          class="nav-bar-inner ss-flex ss-col-center"
          :style="{ height: '100%', paddingLeft: '20rpx' }"
        >
          <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <text class="nav-title ss-m-l-10">{{
            !isReconnecting ? '连接客服成功' : '会话重连中'
          }}</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>

    <!--  覆盖头部导航栏背景颜色  -->
    <view class="page-bg" :style="{ height: sys_navBar + 'px' }"></view>
    <!--  聊天区域  -->
    <MessageList ref="messageListRef">
      <template #bottom>
        <message-input
          v-model="chat.msg"
          @on-tools="onTools"
          @send-message="onSendMessage"
          :auto-focus="false"
          :show-char-count="true"
          :max-length="500"
        ></message-input>
      </template>
    </MessageList>
    <!--  聊天工具  -->
    <tools-popup
      :show-tools="chat.showTools"
      :tools-mode="chat.toolsMode"
      @close="handleToolsClose"
      @on-emoji="onEmoji"
      @image-select="onSelect"
      @on-show-select="onShowSelect"
    >
      <message-input
        v-model="chat.msg"
        @on-tools="onTools"
        @send-message="onSendMessage"
        :auto-focus="false"
        :show-char-count="true"
        :max-length="500"
      ></message-input>
    </tools-popup>
    <!--  商品订单选择  -->
    <SelectPopup
      :mode="chat.selectMode"
      :show="chat.showSelect"
      @select="onSelect"
      @close="chat.showSelect = false"
    />
  </s-layout>
</template>

<script setup>
  import MessageList from '@/pages/chat/components/messageList.vue';
  import { reactive, ref, toRefs } from 'vue';
  import sheep from '@/sheep';
  import ToolsPopup from '@/pages/chat/components/toolsPopup.vue';
  import MessageInput from '@/pages/chat/components/messageInput.vue';
  import SelectPopup from '@/pages/chat/components/select-popup.vue';
  import {
    KeFuMessageContentTypeEnum,
    WebSocketMessageTypeConstants,
  } from '@/pages/chat/util/constants';
  import FileApi from '@/sheep/api/infra/file';
  import KeFuApi from '@/sheep/api/promotion/kefu';
  import { useWebSocket } from './util/useWebSocket';
  import { jsonParse } from '@/sheep/helper/utils';

  const sys_navBar = sheep.$platform.navbar;

  const chat = reactive({
    msg: '',
    scrollInto: '',
    showTools: false,
    toolsMode: '',
    showSelect: false,
    selectMode: '',
  });

  // 发送消息
  async function onSendMessage() {
    if (!chat.msg) return;
    try {
      const data = {
        contentType: KeFuMessageContentTypeEnum.TEXT,
        content: JSON.stringify({ text: chat.msg }),
      };
      await KeFuApi.sendKefuMessage(data);
      chat.msg = '';
    } finally {
      chat.showTools = false;
    }
  }

  const messageListRef = ref();

  //======================= 聊天工具相关 start =======================

  function handleToolsClose() {
    chat.showTools = false;
    chat.toolsMode = '';
  }

  function onEmoji(item) {
    chat.msg += item.name;
  }

  // 点击工具栏开关
  function onTools(mode) {
    if (isReconnecting.value) {
      sheep.$helper.toast('您已掉线！请返回重试');
      return;
    }

    // 第二次点击关闭
    if (chat.showTools && chat.toolsMode === mode) {
      handleToolsClose();
      return;
    }
    // 切换工具栏
    if (chat.showTools && chat.toolsMode !== mode) {
      chat.showTools = false;
      chat.toolsMode = '';
    }
    // 延迟打开等一下过度效果
    setTimeout(() => {
      chat.toolsMode = mode;
      chat.showTools = true;
    }, 200);
  }

  function onShowSelect(mode) {
    chat.showTools = false;
    chat.showSelect = true;
    chat.selectMode = mode;
  }

  async function onSelect({ type, data }) {
    let msg;
    switch (type) {
      case 'image':
        const res = await FileApi.uploadFile(data.tempFiles[0].path);
        msg = {
          contentType: KeFuMessageContentTypeEnum.IMAGE,
          content: JSON.stringify({ picUrl: res.data }),
        };
        break;
      case 'goods':
        msg = {
          contentType: KeFuMessageContentTypeEnum.PRODUCT,
          content: JSON.stringify(data),
        };
        break;
      case 'order':
        msg = {
          contentType: KeFuMessageContentTypeEnum.ORDER,
          content: JSON.stringify(data),
        };
        break;
    }
    if (msg) {
      // 发送消息
      // scrollBottom();
      await KeFuApi.sendKefuMessage(msg);
      await messageListRef.value.refreshMessageList();
      chat.showTools = false;
      chat.showSelect = false;
      chat.selectMode = '';
    }
  }

  //======================= 聊天工具相关 end =======================
  const { options } = useWebSocket({
    // 连接成功
    onConnected: async () => {},
    // 收到消息
    onMessage: async (data) => {
      const type = data.type;
      if (!type) {
        console.error('未知的消息类型：' + data);
        return;
      }
      // 2.2 消息类型：KEFU_MESSAGE_TYPE
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_TYPE) {
        // 刷新消息列表
        await messageListRef.value.refreshMessageList(jsonParse(data.content));
        return;
      }
      // 2.3 消息类型：KEFU_MESSAGE_ADMIN_READ
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_ADMIN_READ) {
        console.log('管理员已读消息');
        // 更新消息已读状态
        sheep.$helper.toast('客服已读您的消息');
      }
    },
  });
  const isReconnecting = toRefs(options).isReconnecting; // 重连状态
</script>

<style scoped lang="scss">
  /* 导航栏 */
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    background: #f8f9f3;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* #ifdef H5 */
    max-width: 750rpx;
    left: 50%;
    transform: translateX(-50%);
    /* #endif */
  }
  .nav-bar-container {
    background: #f8f9f3;
    display: flex;
    align-items: center;
  }
  .back-btn {
    width: 60rpx;
    color: rgba(30, 63, 28, 0.9);
    height: 60rpx;
  }
  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-weight: 600;
  }

  .chat-wrap {
    .page-bg {
      display: none; // 隐藏原有的蓝色背景覆盖
    }

    .status {
      position: relative;
      box-sizing: border-box;
      z-index: 3;
      height: 70rpx;
      padding: 0 30rpx;
      background: var(--ui-BG-Main-opacity-1);
      display: flex;
      align-items: center;
      font-size: 30rpx;
      font-weight: 400;
      color: var(--ui-BG-Main);
    }
  }
</style>
