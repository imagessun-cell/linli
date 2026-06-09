const express = require('express');
const router = express.Router();

const https = require('https');

const BAIDU_AK = process.env.BAIDU_MAP_AK || 'IxdZeE8nWq8yjdn1SnMwhtyzdWDVGvfQ';

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

    const encodedAddr = encodeURIComponent(address);
    const url = `https://api.map.baidu.com/geocoding/v3/?address=${encodedAddr}&output=json&ak=${BAIDU_AK}`;

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
            res.json({ code: 500, message: '地理编码失败', detail: result });
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