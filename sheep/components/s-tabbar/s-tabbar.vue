<template>
  <view
    class="u-page__item"
    v-if="tabbar?.items?.length > 0"
    style="position: relative; z-index: 9999"
  >
    <su-tabbar
      :value="path"
      :fixed="true"
      :placeholder="true"
      :safeAreaInsetBottom="true"
      :inactiveColor="tabbar.style.color"
      :activeColor="tabbar.style.activeColor"
      :midTabBar="tabbar.mode === 2"
      :customStyle="tabbarStyle"
    >
      <su-tabbar-item
        v-for="(item, index) in tabbar.items"
        :key="item.text"
        :text="item.text"
        :name="item.url"
        :badge="item.badge"
        :dot="item.dot"
        :badgeStyle="tabbar.badgeStyle"
        :isCenter="getTabbarCenter(index)"
        :centerImage="sheep.$url.cdn(item.iconUrl)"
        @click="sheep.$router.go(item.url)"
      >
        <template v-slot:active-icon>
          <image class="u-page__item__slot-icon" :src="sheep.$url.cdn(item.activeIconUrl)"></image>
        </template>
        <template v-slot:inactive-icon>
          <image class="u-page__item__slot-icon" :src="sheep.$url.cdn(item.iconUrl)"></image>
        </template>
      </su-tabbar-item>
    </su-tabbar>
  </view>
</template>

<script setup>
  import { computed, unref } from 'vue';
  import sheep from '@/sheep';
  import SuTabbar from '@/sheep/ui/su-tabbar/su-tabbar.vue';

  const tabbar = computed(() => {
    const appStore = sheep.$store('app');
    const tabbarData = appStore.template.basic?.tabbar;
    console.log('[s-tabbar] raw data from store:', tabbarData);

    if (tabbarData && tabbarData.items && tabbarData.items.length > 0) {
      return tabbarData;
    }

    console.log('[s-tabbar] items is empty, using hardcoded fallback');
    // 返回一个默认值作为最后一道防线
    return {
      items: [
        {
          text: '首页',
          url: '/pages/index/index',
          iconUrl: '/static/tabbar/home.webp',
          activeIconUrl: '/static/tabbar/home_active.webp',
        },
        {
          text: '会员',
          url: '/pages/index/member',
          iconUrl: '/static/tabbar/member.webp',
          activeIconUrl: '/static/tabbar/member_active.webp',
        },
        {
          text: '购物车',
          url: '/pages/index/cart',
          iconUrl: '/static/tabbar/cart.webp',
          activeIconUrl: '/static/tabbar/cart_active.webp',
        },
        {
          text: '我的',
          url: '/pages/index/user',
          iconUrl: '/static/tabbar/user.webp',
          activeIconUrl: '/static/tabbar/user_active.webp',
        },
      ],
      style: { color: '#333', activeColor: '#1E3F1C', bgType: 'color', bgColor: '#FFFFFA' },
    };
  });

  const tabbarStyle = computed(() => {
    const backgroundStyle = tabbar.value?.style;
    if (!backgroundStyle) return {};
    if (backgroundStyle.bgType === 'color') {
      return { background: backgroundStyle.bgColor };
    }
    if (backgroundStyle.bgType === 'img')
      return {
        background: `url(${sheep.$url.cdn(
          backgroundStyle.bgImg,
        )}) no-repeat top center / 100% auto`,
      };
    return {};
  });

  const getTabbarCenter = (index) => {
    if (!unref(tabbar) || !unref(tabbar).items) return false;
    return unref(tabbar).items.length % 2 > 0
      ? Math.ceil(unref(tabbar).items.length / 2) === index + 1
      : false;
  };

  const props = defineProps({
    path: {
      type: String,
      default: '',
    },
  });
</script>

<style lang="scss">
  .u-page {
    padding: 0;

    &__item {
      &__title {
        color: var(--textSize);
        background-color: #fff;
        padding: 15px;
        font-size: 15px;

        &__slot-title {
          color: var(--textSize);
          font-size: 14px;
        }
      }

      &__slot-icon {
        width: 25px;
        height: 25px;
      }
    }
  }
</style>
