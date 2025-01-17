// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from 'react';
import { useParams, useHistory, generatePath } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ICommandBarItemProps,
  CommandBar,
  Label,
  Text,
  DetailsList,
  IColumn,
  IconButton,
  Stack,
  CheckboxVisibility,
  DefaultButton,
  mergeStyleSets,
} from '@fluentui/react';

import { State as RootState } from 'RootStateType';
import { selectDeploymentById } from '../../store/deploymentSlice';
import { selectAllCameras } from '../../store/cameraSlice';
import { selectAllLocations } from '../../store/locationSlice';
import { selectAllCascades } from '../../store/cascadeSlice';
import { selectDeviceByKanIdSelectorFactory } from '../../store/computeDeviceSlice';
import { wrapperPadding } from './styles';
import { getFooterClasses } from '../Common/styles';
import { commonCommandBarItems } from '../utils';
import { theme, Url } from '../../constant';
import { AiSkill, DeploymentConfigureCamera, DeploymentFPS } from '../../store/types';

import SidePanelLabel from '../Common/SidePanel/SidePanelLabel';

type ConfigureSkill = {
  skill: string;
  skillName: string;
  skillFPS: number;
  formatedCameraList: {
    cameraName: string;
    locationName: string;
  }[];
};

const getClasses = () =>
  mergeStyleSets({
    root: { ...wrapperPadding },
    header: { fontSize: '24px', lineHeight: '24px' },
    CommandBar: { marginTop: '25px', paddingLeft: 0 },
    contentWrapper: { paddingTop: '25px', height: 'calc( 100vh - 250px)' },
    asideWrapper: { width: '235px', borderRight: `1px solid ${theme.palette.neutralLight}` },
    dateListWrapper: { paddingLeft: '35px' },
    subContentHeader: { fontSize: '14px', lineHeight: '20px' },
  });

const getUsedSkillList = (skillList: AiSkill[], configureCameraList: DeploymentConfigureCamera[]) => {
  const usedSkillIDs = configureCameraList.map((c) => c.skills.map((s) => s.id)).flat(1);

  return skillList.filter((skill) => usedSkillIDs.includes(skill.kan_id));
};

const getDisplayFPS = (
  skillList: AiSkill[],
  configureCameraList: DeploymentConfigureCamera[],
  fpsObj: DeploymentFPS,
): { name: string; fps: string }[] => {
  const result = Object.entries(fpsObj).reduce((acc, [kanId, fps]) => {
    const matchSkill = getUsedSkillList(skillList, configureCameraList).find(
      (skill) => skill.kan_id === kanId,
    );

    if (matchSkill) return [...acc, { name: matchSkill.name, fps }];
    return acc;
  }, []);

  return result;
};

const DeploymentSkillList = () => {
  const { id } = useParams<{ id: string }>();

  const deployment = useSelector((state: RootState) => selectDeploymentById(state, id));
  const locationList = useSelector((state: RootState) => selectAllLocations(state));
  const cameraList = useSelector((state: RootState) => selectAllCameras(state));
  const skillList = useSelector((state: RootState) => selectAllCascades(state));
  const device = useSelector(selectDeviceByKanIdSelectorFactory(deployment.compute_device));

  const [localConfigureCamera, setLocalConfigureCamera] = useState<ConfigureSkill[]>([]);

  const footerClasses = getFooterClasses();
  const history = useHistory();
  const classes = getClasses();

  useEffect(() => {
    if (!deployment || !cameraList.length || !skillList.length || !locationList.length) return;

    const cameraLocationNameMap = cameraList.reduce((accMap, camera) => {
      const matchLocation = locationList.find((location) => location.name === camera.location);

      if (!accMap[camera.kan_id])
        return {
          ...accMap,
          [camera.kan_id]: { cameraName: camera.name, locationName: matchLocation.name },
        };
      return accMap;
    }, {});

    const deploySkillMap = deployment.configure.reduce((accMap, configureCamer) => {
      const newAccMap = { ...accMap };

      configureCamer.skills.forEach((skill) => {
        if (!newAccMap[skill.id]) {
          newAccMap[skill.id] = [cameraLocationNameMap[configureCamer.camera]];
        } else {
          newAccMap[skill.id] = [...accMap[skill.id], cameraLocationNameMap[configureCamer.camera]];
        }
      });

      return newAccMap;
    }, {});

    const configureSkill = Object.keys(deploySkillMap).map((symId) => {
      const matchSkill = skillList.find((skill) => skill.kan_id === symId);

      return {
        skill: symId,
        skillName: matchSkill.name,
        skillFPS: matchSkill.fps,
        formatedCameraList: deploySkillMap[symId],
      };
    });

    setLocalConfigureCamera(configureSkill);
  }, [deployment, cameraList, skillList, locationList]);

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'edit',
      text: 'Edit Deployment',
      iconProps: {
        iconName: 'edit',
      },
      onClick: () => {
        history.push(
          generatePath(Url.DEPLOYMENT_EDIT, {
            id,
            step: 'configure',
          }),
        );
      },
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: {
        iconName: 'Refresh',
      },
      buttonStyles: {
        root: { borderLeft: '1px solid #C8C6C4' },
      },
      onClick: () => history.go(0),
    },
    ...commonCommandBarItems,
  ];

  const columns: IColumn[] = [
    {
      key: 'skill',
      minWidth: 150,
      maxWidth: 150,
      name: 'AI Skill Running',
      fieldName: 'skillName',
      onRender: (item: ConfigureSkill) => (
        <Text
          styles={{
            root: { color: theme.palette.themeSecondary, textDecoration: 'underline', cursor: 'pointer' },
          }}
          onClick={() => {
            history.push(
              generatePath(Url.DEPLOYMENT_DETAIL_SKILL, {
                deployment: id,
                skill: item.skill,
              }),
            );
          }}
        >
          {item.skillName}
        </Text>
      ),
    },
    {
      key: 'cameras',
      minWidth: 250,
      maxWidth: 250,
      name: 'Connected Cameras',
      fieldName: '',
      onRender: (item: ConfigureSkill) => (
        <Stack tokens={{ childrenGap: 15 }}>
          {item.formatedCameraList.length === 0 ? (
            <Text>-</Text>
          ) : (
            item.formatedCameraList.map((camera, id) => <Text key={id}>{camera.cameraName}</Text>)
          )}
        </Stack>
      ),
    },
    {
      key: 'location',
      minWidth: 250,
      maxWidth: 250,
      name: 'Location',
      fieldName: '',
      onRender: (item: ConfigureSkill) => (
        <Stack tokens={{ childrenGap: 15 }}>
          {item.formatedCameraList.length === 0 ? (
            <Text>-</Text>
          ) : (
            item.formatedCameraList.map((camera, id) => <Text key={id}>{camera.locationName}</Text>)
          )}
        </Stack>
      ),
    },
    {
      key: 'button',
      minWidth: 550,
      maxWidth: 550,
      name: '',
      fieldName: '',
      onRender: (item: ConfigureSkill) => (
        <IconButton
          menuIconProps={{ iconName: 'More' }}
          menuProps={{
            items: [
              {
                key: 'view',
                text: 'View AI Skill',
                iconProps: { iconName: 'View' },
                onClick: () => {
                  history.push(
                    generatePath(Url.DEPLOYMENT_DETAIL_SKILL, {
                      deployment: id,
                      skill: item.skill,
                    }),
                  );
                },
              },
            ],
          }}
        />
      ),
    },
  ];

  return (
    <Stack styles={{ root: classes.root }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Label styles={{ root: classes.header }}>{deployment.name}</Label>
        <IconButton iconProps={{ iconName: 'Cancel' }} onClick={() => history.push(Url.DEPLOYMENT)} />
      </Stack>
      <CommandBar styles={{ root: classes.CommandBar }} items={commandBarItems} />
      <Stack horizontal styles={{ root: classes.contentWrapper }}>
        <aside className={classes.asideWrapper}>
          <Label style={{ marginBottom: '25px' }} styles={{ root: classes.subContentHeader }}>
            Deployment Reported Status
          </Label>
          <Stack tokens={{ childrenGap: 15 }}>
            <SidePanelLabel
              title="Frame Rate"
              contentElement={
                <>
                  {Object.keys(deployment.status.fps).length > 0 &&
                    getDisplayFPS(skillList, deployment.configure, deployment.status.fps).map(
                      ({ name, fps }, idx) => <Text key={idx}>{`${name} : ${fps}`}</Text>,
                    )}
                </>
              }
            />
            <SidePanelLabel title="Acceleration" content={device.acceleration} />
          </Stack>
        </aside>
        <Stack className={classes.dateListWrapper}>
          <Label style={{ marginBottom: '10px' }} styles={{ root: classes.subContentHeader }}>
            Deployment AI Skills
          </Label>
          <Text style={{ marginBottom: '25px' }}>
            Below are the skills running in your deployment. Click on one to observe the skill running on your
            connected cameras.
          </Text>
          <DetailsList
            checkboxVisibility={CheckboxVisibility.hidden}
            columns={columns}
            items={localConfigureCamera}
          />
        </Stack>
      </Stack>

      <Stack
        styles={{
          root: footerClasses.root,
        }}
      >
        <DefaultButton
          styles={{ root: { width: '205px' } }}
          iconProps={{ iconName: 'ChevronLeft' }}
          onClick={() => history.push(Url.DEPLOYMENT)}
        >
          Back to Deployments
        </DefaultButton>
      </Stack>
    </Stack>
  );
};

export default DeploymentSkillList;
