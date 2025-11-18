// app/api/consulta-dni/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const numero = searchParams.get('numero');

  // Validar que el número esté presente y sea válido
  if (!numero || numero.length !== 8 || !/^\d+$/.test(numero)) {
    return new Response(
      JSON.stringify({ error: 'DNI inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const apiKey = process.env.API_KEY_RUC_DNI;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key no configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(
      `https://api.decolecta.com/v1/reniec/dni?numero=${numero}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error en la consulta: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        } 
      }
    );
  } catch (error) {
    console.error("Error al consultar DNI:", error);
    return new Response(
      JSON.stringify({ error: 'Error al consultar el DNI' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Manejar preflight CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}