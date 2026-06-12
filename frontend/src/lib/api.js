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
