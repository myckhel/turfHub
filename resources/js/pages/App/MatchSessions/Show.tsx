import { Head } from '@inertiajs/react';
import React from 'react';
import { MatchSessionDetails } from '../../../components/MatchSessions';
import type { MatchSession } from '../../../types/matchSession.types';
import type { Turf } from '../../../types/turf.types';

interface ShowProps {
  turf: Turf;
  matchSession: MatchSession;
}

const Show: React.FC<ShowProps> = ({ turf, matchSession }) => {
  return (
    <>
      <Head title={`${matchSession.name} - ${turf.name}`} />
      <MatchSessionDetails turfId={turf.id} matchSessionId={matchSession.id} />
    </>
  );
};

export default Show;
