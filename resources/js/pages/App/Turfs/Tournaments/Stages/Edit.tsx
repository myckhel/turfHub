import { router } from '@inertiajs/react';
import { Card } from 'antd';
import { memo } from 'react';
import StageForm from '../../../../../components/Tournaments/Stage/StageForm';
import type { Stage, Tournament } from '../../../../../types/tournament.types';

interface EditStageProps {
  tournament: Tournament;
  stage: Stage;
}

const EditStage = memo(({ tournament, stage }: EditStageProps) => {
  const handleCancel = () => {
    router.visit(route('tournaments.stages.show', { tournament: tournament.id, stage: stage.id }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="mb-1 text-2xl font-bold">Edit Stage</h1>
        <p className="text-gray-600">
          Update {stage.name} in {tournament.name}
        </p>
      </div>

      {/* Form */}
      <Card>
        <StageForm tournamentId={tournament.id} existingStage={stage} onCancel={handleCancel} />
      </Card>
    </div>
  );
});

EditStage.displayName = 'EditStage';

export default EditStage;
