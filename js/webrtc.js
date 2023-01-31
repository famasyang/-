const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('open', () => {
  console.log('WebSocket connected');
  start(true);
});

socket.addEventListener('message', (event) => {
  handleMessage(JSON.parse(event.data));
});

const sendMessage = (message) => {
  socket.send(JSON.stringify(message));
};

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ]
};

let pc;

const handleMessage = (message) => {
  switch (message.type) {
    case 'offer':
      pc.setRemoteDescription(new RTCSessionDescription(message));
      pc.createAnswer().then((description) => {
        pc.setLocalDescription(description);
        sendMessage(description);
      });
      break;
    case 'answer':
      pc.setRemoteDescription(new RTCSessionDescription(message));
      break;
    case 'candidate':
      pc.addIceCandidate(new RTCIceCandidate(message.candidate));
      break;
    default:
      console.error('Unrecognized message type: ', message.type);
  }
};

const start = (isCaller) => {
  pc = new RTCPeerConnection(configuration);
  pc.addEventListener('icecandidate', (event) => {
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        candidate: event.candidate
      });
    }
  });
  pc.addEventListener('addstream', (event) => {
    document.querySelector('#remote-audio').srcObject = event.stream;
  });
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    document.querySelector('#local-audio').srcObject = stream;
    pc.addStream(stream);
    if (isCaller) {
      pc.createOffer().then((description) => {
        pc.setLocalDescription(description);
        sendMessage(description);
      });
    }
  });
};
