<template>
  <view v-if="text" class="s-watermark" :style="{ zIndex }">
    <view class="s-watermark__layer" :style="{ transform: `rotate(${rotate}deg)` }">
      <text
        v-for="i in tiles"
        :key="i"
        class="s-watermark__text"
        :style="{
          color,
          fontSize: fontSize + 'rpx',
          width: tileWidth + 'rpx',
          margin: gapY / 2 + 'rpx ' + gapX / 2 + 'rpx',
        }"
      >
        {{ text }}
      </text>
    </view>
  </view>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue';

  const props = defineProps({
    text: {
      type: String,
      default: '',
    },
    rotate: {
      type: Number,
      default: -25,
    },
    color: {
      type: String,
      default: 'rgba(0, 0, 0, 0.08)',
    },
    fontSize: {
      type: Number,
      default: 24,
    },
    zIndex: {
      type: Number,
      default: 9999,
    },
    tileWidth: {
      type: Number,
      default: 240,
    },
    gapX: {
      type: Number,
      default: 140,
    },
    gapY: {
      type: Number,
      default: 120,
    },
  });

  const tiles = ref([]);

  const tileCount = computed(() => tiles.value.length);

  const rebuildTiles = () => {
    const rawText = (props.text || '').trim();
    if (!rawText) {
      tiles.value = [];
      return;
    }

    const info = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {};
    const w = Number(info.windowWidth || 375);
    const h = Number(info.windowHeight || 667);
    const rpx2px = w / 750;

    const cellWpx = (props.tileWidth + props.gapX) * rpx2px;
    const cellHpx = (props.fontSize + props.gapY) * rpx2px;

    const cols = Math.max(1, Math.ceil((w * 2) / Math.max(1, cellWpx)));
    const rows = Math.max(1, Math.ceil((h * 2) / Math.max(1, cellHpx)));
    const count = Math.min(600, cols * rows);

    tiles.value = Array.from({ length: count }, (_, idx) => idx);
  };

  onMounted(rebuildTiles);
  watch(
    () => props.text,
    () => rebuildTiles(),
  );
</script>

<style lang="scss" scoped>
  .s-watermark {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  }

  .s-watermark__layer {
    position: absolute;
    left: -50%;
    top: -50%;
    width: 200%;
    height: 200%;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
  }

  .s-watermark__text {
    display: block;
    white-space: nowrap;
  }
</style>
