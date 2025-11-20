import { TrophyOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Card, Typography } from 'antd';
import StageForm from '../../../../../components/Tournaments/Stage/StageForm';
import type { Tournament } from '../../../../../types/tournament.types';

const { Title, Text } = Typography;

interface CreateStageProps {
  tournament: Tournament;
  nextOrder: number;
}

const CreateStage = ({ tournament, nextOrder }: CreateStageProps) => {
  const handleCancel = () => {
    router.visit(route('tournaments.show', { tournament: tournament.id }));
  };

  return (
    <>
      <Head title={`Create Stage - ${tournament.name}`} />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {/* Header */}
          <div>
            <Title level={2} className="mb-1 flex items-center gap-2">
              <TrophyOutlined className="text-yellow-500" />
              Create New Stage
            </Title>
            <Text className="text-gray-600">Add a new stage to {tournament.name}</Text>
          </div>

          {/* Form */}
          <Card>
            <StageForm tournamentId={tournament.id} nextOrder={nextOrder} onCancel={handleCancel} />
          </Card>
        </div>
      </div>
    </>
  );
};

CreateStage.displayName = 'CreateStage';

export default CreateStage;
