import sheep from '@/sheep';
import { formatImageUrlProtocol, getWxaQrcode } from './index';
import { baseUrl } from '@/sheep/config';

const goods = async (poster) => {
  const width = poster.width;
  const scale = width / 750;
  const wxa_qrcode = await getWxaQrcode(poster.shareInfo.path, poster.shareInfo.query);
  const bg = sheep.$url.cdn('/mp/static/share/shareGuide.webp');
  const logo = sheep.$url.cdn('/mp/static/share/shareLogo.webp');
  let posterImage = poster.shareInfo.poster.picUrl
  const priceText = Number(poster.shareInfo.poster.price || 0).toFixed(2);
  return [
    {
      type: 'rect',
      css: {
        width: width,
        height: 1080 * scale,
        color: '#F8F9F3',
        top: 0,
        left: 0,
        zIndex: -2,
      },
    },
    {
      type: 'image',
      src: formatImageUrlProtocol(bg),
      css: {
        width: 686 * scale,
        height: 1000 * scale,
        top: 40 * scale,
        left: 32 * scale,
        zIndex: -1,
      },
    },
    {
      type: 'rect',
      css: {
        width: 626 * scale,
        height: 795 * scale,
        top: 145 * scale,
        left: 62 * scale,
        color: '#FFFFFF',
        borderRadius: 20 * scale,
      },
    },
    {
      type: 'image',
      src: formatImageUrlProtocol(logo),
      css: {
        width: 200 * scale,
        height: 61 * scale,
        top: 60 * scale,
        left: 62 * scale,
      },
    },
    {
      type: 'image',
      src: formatImageUrlProtocol(posterImage),
      css: {
        width: 567 * scale,
        height: 567 * scale,
        top: 175 * scale,
        left: 91.5 * scale,
        borderRadius: 20 * scale,
      },
    },
    {
      type: 'text',
      text: poster.shareInfo.poster.title,
      css: {
        position: 'absolute',
        top: 772 * scale,
        left: 91.5 * scale,
        color: '#1D2129',
        fontSize: 28 * scale,
        lineHeight: 40 * scale,
        fontWeight: '500',
        maxWidth: 380 * scale,
        maxLines: 2,
      },
    },
    {
      type: 'text',
      text: '¥',
      css: {
        position: 'absolute',
        top: 882 * scale,
        left: 91.5 * scale,
        color: '#F53F3F',
        fontSize: 28 * scale,
        fontFamily: 'DINAlternate',
        fontWeight: 'bold',
      },
    },
    {
      type: 'text',
      text: priceText,
      css: {
        position: 'absolute',
        top: 866 * scale,
        left: 111.5 * scale,
        color: '#F53F3F',
        fontSize: 50 * scale,
        fontFamily: 'DINAlternate',
        fontWeight: 'bold',
      },
    },
    // #ifndef MP-WEIXIN
    {
      type: 'qrcode',
      text: poster.shareInfo.link,
      css: {
        position: 'absolute',
        top: 772 * scale,
        left: 516.5 * scale,
        width: 142 * scale,
        height: 142 * scale,
      },
    },
    // #endif
    // #ifdef MP-WEIXIN
    {
      type: 'image',
      src: wxa_qrcode,
      css: {
        position: 'absolute',
        top: 772 * scale,
        left: 516.5 * scale,
        width: 142 * scale,
        height: 142 * scale,
      },
    },
    // #endif
    {
      type: 'text',
      text: '以甄选之心，传故土本草之韵',
      css: {
        position: 'absolute',
        top: 955 * scale, // 调整 margintop 增加 20 * scale
        left: 116 * scale,
        color: '#1E3F1C',
        fontSize: 26 * scale,
        letterSpacing: 15 * scale,
        fontWeight: '500',
      },
    },
  ];
};

export default goods;
