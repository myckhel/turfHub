import { Card, Empty, Pagination, Space, Typography } from 'antd';
import { memo, useMemo } from 'react';
import { gameMatchApi } from '../../../apis/gameMatch';
import { useServerPagination } from '../../../hooks/useServerPagination';
import type { GameMatchFilters } from '../../../types/gameMatch.types';
import type { Fixture } from '../../../types/tournament.types';
import FixtureSchedule from './FixtureSchedule';

interface FixtureScheduleContainerProps {
  stageId?: number;
  groupId?: number;
  status?: Fixture['status'];
  perPage?: number;
  include?: string;
  onEditScore?: (fixture: Fixture) => void;
}

const FixtureScheduleContainer = memo(({ stageId, groupId, status, perPage = 12, include, onEditScore }: FixtureScheduleContainerProps) => {
  const { items, page, pageSize, total, loading, setPage, setPageSize, setFilters } = useServerPagination<Fixture, GameMatchFilters>(
    gameMatchApi.getAll,
    {
      initialParams: {
        stage_id: stageId,
        group_id: groupId,
        status,
        include,
        per_page: perPage,
        page: 1,
      },
    },
  );

  // Keep filters up to date when props change
  useMemo(() => {
    setFilters((prev) => ({
      ...prev,
      stage_id: stageId,
      group_id: groupId,
      status,
      include,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId, groupId, status, include]);

  const showEmpty = !loading && items.length === 0;

  return (
    <div className="space-y-4">
      {showEmpty ? (
        <Card>
          <div className="py-12 text-center">
            <Space direction="vertical" size="large">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Typography.Text className="text-gray-500">No fixtures available yet</Typography.Text>}
              />
            </Space>
          </div>
        </Card>
      ) : (
        <>
          <FixtureSchedule fixtures={items} loading={loading} onEditScore={onEditScore} />
          <Card className="flex items-center justify-center">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p, s) => {
                setPage(p);
                if (s !== pageSize) setPageSize(s);
              }}
              showSizeChanger
              showTotal={(t) => `${t} fixtures`}
            />
          </Card>
        </>
      )}
    </div>
  );
});

FixtureScheduleContainer.displayName = 'FixtureScheduleContainer';

export default FixtureScheduleContainer;
