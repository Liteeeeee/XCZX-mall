import sheep from '@/sheep';
import { formatImageUrlProtocol, getWxaQrcode } from './index';
import { baseUrl } from '@/sheep/config';

const goods = async (poster) => {
  const width = poster.width;
  const wxa_qrcode = await getWxaQrcode(poster.shareInfo.path, poster.shareInfo.query);
  const bg = sheep.$store('app').platform.share.posterInfo.goods_bg || '/static/img/shop/config/goods-poster-bg.webp';
  const normalizePosterImage = (url) => {
    const value = String(url || '');
    if (!value) return '/mp/static/share/shareImage.webp';
    if (value.includes('/admin-api/infra/file/')) {
      return value.replace('/admin-api/infra/file/', '/app-api/infra/file/');
    }
    if (value.startsWith('/app-api/') || value.startsWith('/admin-api/')) {
      const origin = String(baseUrl || '').replace(/\/+$/, '');
      return `${origin}${value.replace('/admin-api/', '/app-api/')}`;
    }
    return value;
  };
  const posterImage = normalizePosterImage(
    poster.shareInfo.poster.picUrl || poster.shareInfo.poster.image,
  );
  const cardWidth = width * 0.915;
  const cardLeft = (width - cardWidth) / 2;
  const cardTop = width * 0.24;
  const thumbSize = width * 0.29;
  const qrcodeSize = width * 0.205;
  const titleLeft = cardLeft + thumbSize + width * 0.055;
  const titleMaxWidth = cardWidth - thumbSize - qrcodeSize - width * 0.12;
  const priceText = Number(poster.shareInfo.poster.price || 0).toFixed(2);
  return [
    {
      type: 'image',
      src: formatImageUrlProtocol(sheep.$url.cdn(bg)),
      css: {
        width,
        position: 'fixed',
        'object-fit': 'contain',
        top: '0',
        left: '0',
        zIndex: -1,
      },
    },
    {
      type: 'image',
      src: formatImageUrlProtocol(posterImage),
      css: {
        position: 'fixed',
        left: cardLeft + width * 0.035,
        top: cardTop + width * 0.04,
        width: thumbSize,
        height: thumbSize,
        borderRadius: 10,
      },
    },
    {
      type: 'text',
      text: poster.shareInfo.poster.title,
      css: {
        position: 'fixed',
        left: titleLeft,
        top: cardTop + width * 0.04,
        color: '#1D2129',
        fontSize: 14,
        lineHeight: 20,
        maxWidth: titleMaxWidth,
      },
    },
    {
      type: 'text',
      text: '¥',
      css: {
        position: 'fixed',
        left: titleLeft,
        top: cardTop + width * 0.215,
        color: '#F53F3F',
        fontSize: 18,
        fontFamily: 'DINAlternate-Bold',
        fontWeight: '700',
      },
    },
    {
      type: 'text',
      text: priceText,
      css: {
        position: 'fixed',
        left: titleLeft + width * 0.05,
        top: cardTop + width * 0.198,
        color: '#F53F3F',
        fontSize: 26,
        fontFamily: 'DINAlternate-Bold',
        fontWeight: '700',
      },
    },
    // #ifndef MP-WEIXIN
    {
      type: 'qrcode',
      text: poster.shareInfo.link,
      css: {
        position: 'fixed',
        left: cardLeft + cardWidth - qrcodeSize - width * 0.035,
        top: cardTop + width * 0.075,
        width: qrcodeSize,
        height: qrcodeSize,
      },
    },
    // #endif
    // #ifdef MP-WEIXIN
    {
      type: 'image',
      src: wxa_qrcode,
      css: {
        position: 'fixed',
        left: cardLeft + cardWidth - qrcodeSize - width * 0.035,
        top: cardTop + width * 0.075,
        width: qrcodeSize,
        height: qrcodeSize,
      },
    },
    // #endif
    {
      type: 'text',
      text: '微信扫码',
      css: {
        position: 'fixed',
        left: cardLeft + cardWidth - qrcodeSize - width * 0.008,
        top: cardTop + width * 0.295,
        color: '#1E3F1C',
        fontSize: 12,
        letterSpacing: 2,
      },
    },
  ];
};

export default goods;
