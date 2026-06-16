const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export async function fetchBootstrap({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/bootstrap`, {
    headers: {
      Accept: "application/json"
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`Backend bootstrap failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function saveFile(fileId, body) {
  const response = await fetch(`${API_BASE_URL}/files/${fileId}/autosave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Autosave failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function createFile(body) {
  const response = await fetch(`${API_BASE_URL}/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Create file failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function updateFile(fileId, body) {
  const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Update file failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function deleteFile(fileId) {
  const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(`Delete file failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function restoreFile(fileId) {
  const response = await fetch(`${API_BASE_URL}/files/${fileId}/restore`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Restore file failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function createShare(fileId, role) {
  const response = await fetch(`${API_BASE_URL}/files/${fileId}/share`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ role })
  });

  if (!response.ok) {
    throw new Error(`Share failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function createComment(fileId, body) {
  const response = await fetch(`${API_BASE_URL}/files/${fileId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Comment failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function resolveComment(commentId) {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}/resolve`, {
    method: "PATCH"
  });

  if (!response.ok) {
    throw new Error(`Resolve comment failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function generateDiagram(body) {
  const response = await fetch(`${API_BASE_URL}/ai/diagrams/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Generate diagram failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export async function createExport(fileId, format) {
  const response = await fetch(`${API_BASE_URL}/exports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fileId, format })
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}
