function permanentNewsRedirect() {
  return new Response(null, {
    status: 301,
    headers: {
      Location: "/novosti",
    },
  });
}

export async function GET() {
  return permanentNewsRedirect();
}

export async function HEAD() {
  return permanentNewsRedirect();
}
