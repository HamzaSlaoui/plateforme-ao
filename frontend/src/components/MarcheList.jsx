// components/MarcheList.jsx
import MarcheTable from './MarcheTable';

export default function MarcheList({ marches }) {
  return (
    <div className="mt-6">
      <MarcheTable marches={marches} />
    </div>
  );
}
