import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;

const s3Client = REGION ? new S3Client({ region: REGION }) : null;

/**
 * Descarga una imagen desde una URL externa y la sube a S3, devolviendo la
 * URL pública propia. Si S3 no está configurado o falla, devuelve la URL
 * original sin bloquear el flujo de creación de la planificación.
 */
export async function guardarImagenEnS3(imagenUrl: string): Promise<string> {
  if (!s3Client || !BUCKET) {
    return imagenUrl;
  }

  try {
    const response = await fetch(imagenUrl);
    if (!response.ok) {
      console.warn(`No se pudo descargar la imagen para subir a S3: ${response.status}`);
      return imagenUrl;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    const key = `planificaciones/${randomUUID()}.jpg`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.warn('Error subiendo imagen a S3:', error);
    return imagenUrl;
  }
}
