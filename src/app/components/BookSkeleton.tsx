"use client"

import { Skeleton } from 'antd';
import styles from '../page.module.css';

export const BookRowSkeleton = (props: { grid?: boolean }) => {
  if (props.grid) {
    return (
      <div className={styles.displayForGrid} style={{ alignItems: 'center' }}>
        <Skeleton.Image style={{ width: 90, height: 140 }} active />
        <Skeleton.Input style={{ width: 80, marginTop: 4 }} active size="small" />
      </div>
    );
  }
  return (
    <>
      <div style={{ justifySelf: 'center' }}>
        <Skeleton.Image style={{ width: 90, height: 140 }} active />
      </div>
      <div style={{ paddingRight: 16 }}>
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      </div>
      <div style={{ alignSelf: 'center' }}>
        <Skeleton.Button active size="small" shape="round" style={{ width: 70 }} />
      </div>
    </>
  );
};

export const GraphsSkeleton = () => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, marginTop: 24 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ width: 180 }}>
          <Skeleton.Input active style={{ width: 140, height: 20, margin: '0 auto 12px' }} />
          <Skeleton active paragraph={{ rows: 6 }} title={false} />
        </div>
      ))}
      {[...Array(2)].map((_, i) => (
        <div key={`pie-${i}`} style={{ width: 180 }}>
          <Skeleton.Input active style={{ width: 140, height: 20, margin: '0 auto 12px' }} />
          <Skeleton.Avatar active shape="circle" size={140} style={{ margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
};

export default BookRowSkeleton;