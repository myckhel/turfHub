import { Head } from '@inertiajs/react';
import React from 'react';
import { MatchSessionForm } from '../../../components/MatchSessions';
import type { Turf } from '../../../types/turf.types';

interface CreateProps {
  turf: { data: Turf };
}

const Create: React.FC<CreateProps> = ({ turf }) => {
  return (
    <>
      <Head title={`Create Match Session - ${turf?.data.name}`} />
      <MatchSessionForm turfId={turf?.data.id} />
    </>
  );
};

export default Create;
