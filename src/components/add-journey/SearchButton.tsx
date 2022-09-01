import axios from 'axios';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useThrottleState } from 'react-relaxed';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TRANSPORT_API_URL } from '@/constants';
import { useJourneySearchStore } from '@/hooks/useJourneySearchStore';

export const SearchButton: React.FC = () => {
  const departureTime = useJourneySearchStore((state) => state.departureTime);
  const departureStation = useJourneySearchStore((state) => state.departureStation);
  const arrivalStation = useJourneySearchStore((state) => state.arrivalStation);
  const setConnections = useJourneySearchStore((state) => state.setConnections);

  const [, setLoading, loading] = useThrottleState(false, 150);

  const t = useTranslations();

  const getConnections = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${TRANSPORT_API_URL}/connections?from=${departureStation?.name}&to=${arrivalStation?.name}&date=${
          departureTime.split('T')[0]
        }&time=${departureTime.split('T')[1]}`
      );

      setConnections(data.connections);
    } catch (error) {
      toast.error('Unable to load connections');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* This is a hacky workaround to get a correct desktop layout */}
      <label htmlFor="time" className="hidden text-sm font-medium text-gray-700 lg:block lg:invisible">
        Search
      </label>
      <div className="mt-1">
        <button
          onClick={getConnections}
          className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {loading ? <LoadingSpinner /> : t('add.search')}
        </button>
      </div>
    </div>
  );
};
