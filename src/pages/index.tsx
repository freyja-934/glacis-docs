import { Redirect } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import React from 'react';

export default function Home(): React.ReactElement {
  return <Redirect to={useBaseUrl('/overview/introduction')} />;
} 