import { Head } from '@inertiajs/react';
import React from 'react';
import { MatchSessionForm } from '../../../components/MatchSessions';
import type { MatchSession } from '../../../types/matchSession.types';
import type { Turf } from '../../../types/turf.types';

interface EditProps {
  turf: Turf;
  matchSession: MatchSession;
}

const Edit: React.FC<EditProps> = ({ turf, matchSession }) => {
  return (
    <>
      <Head title={`Edit ${matchSession.name} - ${turf.name}`} />
      <MatchSessionForm turfId={turf.id} matchSession={matchSession} isEditing={true} />
    </>
  );
};

export default Edit;
