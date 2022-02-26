const messages = [];

exports.addMessage = (id, name, message) => {
  messages.push({ id, name, message });
  return { messages };
};

exports.getMessages = () => {
  return messages;
};
