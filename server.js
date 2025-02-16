const { exec } = require("child_process");
const express = require('express');
const app = express();
app.use(express.json());

let subscribers = [];

// 订阅功能
app.post('/subscribe', (req, res) => {
  const { email } = req.body;
  if (!subscribers.includes(email)) {
    subscribers.push(email);
    res.send('Subscription successful!');
  } else {
    res.send('Already subscribed!');
  }
});

app.post('/publish', (req, res) => {
  const { message } = req.body;
  subscribers.forEach(email => {
    // 发送邮件逻辑（此处省略）
    console.log(`Sending message to ${email}: ${message}`);
  });
  res.send('Message sent to all subscribers!');
});

// 显示节点信息
app.get('/node-info', (req, res) => {
  const nodeInfo = {
    v: "2",
    ps: "My VLESS Node",
    add: "your-domain.com",
    port: "443",
    id: process.env.VLESS_UUID,
    aid: "0",
    net: "ws",
    type: "none",
    host: "your-domain.com",
    path: "/websocket",
    tls: "tls"
  };
  const nodeInfoString = `vless://${nodeInfo.id}@${nodeInfo.add}:${nodeInfo.port}?type=${nodeInfo.net}&security=${nodeInfo.tls}&path=${nodeInfo.path}&host=${nodeInfo.host}#${encodeURIComponent(nodeInfo.ps)}`;
  res.send(`<html><body><h1>Node Information</h1><p>${nodeInfoString}</p></body></html>`);
});

// 从环境变量中获取UUID和token
const uuid = process.env.VLESS_UUID;
const cloudflareToken = process.env.CLOUDFLARE_TOKEN;

// 下载并配置Xray和cloudflared
exec(`
  wget https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip &&
  unzip Xray-linux-64.zip &&
  chmod +x xray &&
  mv xray /app/myapp &&
  wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 &&
  chmod +x cloudflared-linux-amd64 &&
  mv cloudflared-linux-amd64 /app/cloudflared
`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(stdout);

  // 启动Xray
  exec("/app/myapp run -c /app/config.json", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });

  // 启动Cloudflare Argo Tunnel使用Zertunel的token
  exec(`./cloudflared tunnel --config /app/cloudflared-config.yml run --token ${cloudflareToken}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
});

// 启动订阅服务
app.listen(3001, () => {
  console.log('Subscription service running on port 3001');
});