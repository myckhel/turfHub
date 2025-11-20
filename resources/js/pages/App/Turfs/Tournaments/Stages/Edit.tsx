import { router } from '@inertiajs/react';
import { Card, message } from 'antd';
import { memo } from 'react';
import StageForm from '../../../../../components/Tournaments/Stage/StageForm';
import { useTournamentStore } from '../../../../../stores';
import type { CreateStageRequest, Stage, Tournament } from '../../../../../types/tournament.types';

interface EditStageProps {
  tournament: Tournament;
  stage: Stage;
}

const EditStage = memo(({ tournament, stage }: EditStageProps) => {
  const { updateStage, isLoadingStage } = useTournamentStore();

  const handleSubmit = async (data: CreateStageRequest) => {
    try {
      await updateStage(stage.id, data);
      message.success('Stage updated successfully');
      router.visit(route('tournaments.stages.show', { tournament: tournament.id, stage: stage.id }));
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message || 'Failed to update stage');
      }
      throw error;
    }
  };

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
        <StageForm tournamentId={tournament.id} existingStage={stage} onSubmit={handleSubmit} onCancel={handleCancel} loading={isLoadingStage} />
      </Card>
    </div>
  );
});

EditStage.displayName = 'EditStage';

export default EditStage;
