import { useParams } from 'react-router-dom';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-text-dark">Preview</h1>
      <p className="text-text-muted mt-2">Planificación ID: {id}</p>
    </div>
  );
}
