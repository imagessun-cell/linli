const express = require('express');
const router = express.Router();

const https = require('https');

const BAIDU_AK = process.env.BAIDU_MAP_AK || 'IxdZeE8nWq8yjdn1SnMwhtyzdWDVGvfQ';

const BEIJING_CENTER = { lat: 39.9042, lng: 116.4074 };

const AREA_CENTERS = [
  { key: '望京', lat: 39.9968, lng: 116.4701 },
  { key: '花家地', lat: 39.9847, lng: 116.4689 },
  { key: '南湖', lat: 39.9898, lng: 116.4712 },
  { key: '三里屯', lat: 39.9366, lng: 116.4551 },
  { key: '双井', lat: 39.8948, lng: 116.4696 },
  { key: '劲松', lat: 39.8848, lng: 116.4616 },
  { key: '潘家园', lat: 39.8759, lng: 116.4662 },
  { key: '国贸', lat: 39.9087, lng: 116.4590 },
  { key: '呼家楼', lat: 39.9213, lng: 116.4613 },
  { key: '亚运村', lat: 39.9911, lng: 116.4073 },
  { key: '酒仙桥', lat: 39.9737, lng: 116.4923 },
  { key: '管庄', lat: 39.9097, lng: 116.5956 },
  { key: '通州', lat: 39.9025, lng: 116.6564 },
  { key: '亦庄', lat: 39.7937, lng: 116.5060 }
];

const DISTRICT_CENTERS = [
  { key: '东城区', lat: 39.9289, lng: 116.4164 },
  { key: '西城区', lat: 39.9123, lng: 116.3659 },
  { key: '朝阳区', lat: 39.9219, lng: 116.4436 },
  { key: '海淀区', lat: 39.9599, lng: 116.2981 },
  { key: '丰台区', lat: 39.8584, lng: 116.2869 },
  { key: '石景山区', lat: 39.9056, lng: 116.2229 },
  { key: '通州区', lat: 39.9025, lng: 116.6564 },
  { key: '顺义区', lat: 40.1289, lng: 116.6546 },
  { key: '昌平区', lat: 40.2207, lng: 116.2312 },
  { key: '大兴区', lat: 39.7289, lng: 116.3414 },
  { key: '房山区', lat: 39.7488, lng: 116.1435 },
  { key: '门头沟区', lat: 39.9406, lng: 116.1017 },
  { key: '怀柔区', lat: 40.3160, lng: 116.6320 },
  { key: '平谷区', lat: 40.1407, lng: 117.1214 },
  { key: '密云区', lat: 40.3774, lng: 116.8430 },
  { key: '延庆区', lat: 40.4568, lng: 115.9749 }
];

function getLocalGeocodeFallback(address) {
  const text = String(address || '');
  const areaMatch = AREA_CENTERS.find(item => text.includes(item.key));
  if (areaMatch) {
    return { lat: areaMatch.lat, lng: areaMatch.lng, source: 'local_area' };
  }

  const districtMatch = DISTRICT_CENTERS.find(item => text.includes(item.key));
  if (districtMatch) {
    return { lat: districtMatch.lat, lng: districtMatch.lng, source: 'local_district' };
  }

  if (/北京|北京市/.test(text)) {
    return { ...BEIJING_CENTER, source: 'local_city' };
  }

  return null;
}

function sendGeocodeFallback(res, address, detail) {
  const fallback = getLocalGeocodeFallback(address);
  if (fallback) {
    return res.json({ code: 0, message: 'local fallback', data: fallback });
  }
  return res.json({ code: 500, message: '地理编码失败', detail });
}

router.get('/convert', async (req, res) => {
  try {
    const { lat, lng, from = 1, to = 5 } = req.query;

    if (!lat || !lng) {
      return res.json({ code: 400, message: '缺少坐标参数' });
    }

    const coords = `${lng},${lat}`;
    const url = `https://api.map.baidu.com/geoconv/v1/?coords=${coords}&from=${from}&to=${to}&ak=${BAIDU_AK}`;

    https.get(url, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 0 && result.result && result.result[0]) {
            res.json({
              code: 0,
              message: 'OK',
              data: {
                lat: result.result[0].y,
                lng: result.result[0].x
              }
            });
          } else {
            res.json({ code: 500, message: '坐标转换失败', detail: result });
          }
        } catch (e) {
          res.json({ code: 500, message: '解析响应失败' });
        }
      });
    }).on('error', () => {
      res.json({ code: 500, message: '调用百度API失败' });
    });
  } catch (e) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.json({ code: 400, message: '缺少地址参数' });
    }

    const normalizedAddress = /北京|北京市/.test(address) ? address : `北京市${address}`;
    const encodedAddr = encodeURIComponent(normalizedAddress);
    const url = `https://api.map.baidu.com/geocoding/v3/?address=${encodedAddr}&city=北京市&output=json&ret_coordtype=bd09ll&ak=${BAIDU_AK}`;

    https.get(url, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 0 && result.result) {
            res.json({
              code: 0,
              message: 'OK',
              data: {
                lat: result.result.location.lat,
                lng: result.result.location.lng
              }
            });
          } else {
            sendGeocodeFallback(res, normalizedAddress, result);
          }
        } catch (e) {
          sendGeocodeFallback(res, normalizedAddress, { message: '解析响应失败' });
        }
      });
    }).on('error', () => {
      sendGeocodeFallback(res, normalizedAddress, { message: '调用百度API失败' });
    });
  } catch (e) {
    sendGeocodeFallback(res, req.query?.address, { message: '服务器错误' });
  }
});

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000;
}

router.get('/distance', (req, res) => {
  const { lat1, lng1, lat2, lng2 } = req.query;

  if (!lat1 || !lng1 || !lat2 || !lng2) {
    return res.json({ code: 400, message: '缺少坐标参数' });
  }

  const distance = getDistance(
    parseFloat(lat1), parseFloat(lng1),
    parseFloat(lat2), parseFloat(lng2)
  );

  res.json({ code: 0, message: 'OK', data: { distance: Math.round(distance) } });
});

// IP 定位（不依赖浏览器权限）
router.get('/ip', async (req, res) => {
  try {
    const userIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || '';
    const ip = userIp.split(',')[0].trim();
    console.log('[location/ip] client IP:', ip);

    const url = `https://api.map.baidu.com/location/ip?ak=${BAIDU_AK}&ip=${ip}&coor=bd09ll`;
    https.get(url, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('[location/ip] baidu response:', result);
          if (result.status === 0 && result.content && result.content.point) {
            const bdLat = parseFloat(result.content.point.y);
            const bdLng = parseFloat(result.content.point.x);
            if (bdLat && bdLng) {
              return res.json({
                code: 0,
                message: 'OK',
                data: { lat: bdLat, lng: bdLng, address: result.content.address || '' }
              });
            }
          }
          res.json({ code: 0, message: 'fallback', data: { lat: 39.929, lng: 116.494 } });
        } catch (e) {
          res.json({ code: 0, message: 'parse error', data: { lat: 39.929, lng: 116.494 } });
        }
      });
    }).on('error', () => {
      res.json({ code: 0, message: 'http error', data: { lat: 39.929, lng: 116.494 } });
    });
  } catch (e) {
    res.json({ code: 0, message: 'server error', data: { lat: 39.929, lng: 116.494 } });
  }
});

module.exports = router;
module.exports.getDistance = getDistance;
