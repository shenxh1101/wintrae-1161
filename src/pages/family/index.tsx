import React, { useState } from 'react';
import { View, Text, Image, Switch, Button, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import { RELATION_LIST } from '@/utils';

const FamilyPage: React.FC = () => {
  const {
    familyMembers,
    familySharingEnabled,
    toggleFamilySharing,
    addFamilyMember,
    removeFamilyMember,
    updateFamilyMember
  } = useStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addRelation, setAddRelation] = useState<string>('');
  const [addPhone, setAddPhone] = useState('');
  const [addCanView, setAddCanView] = useState(true);
  const [addCanEdit, setAddCanEdit] = useState(false);

  const handleMasterToggle = (enabled: boolean) => {
    toggleFamilySharing();
    console.log('[FamilyPage] Master sharing toggled:', enabled);
    Taro.showToast({
      title: enabled ? '家属共享已开启' : '家属共享已关闭',
      icon: 'none'
    });
  };

  const handlePermToggle = (id: string, field: 'canView' | 'canEdit', value: boolean) => {
    updateFamilyMember(id, { [field]: value });
    console.log('[FamilyPage] Permission updated:', { id, field, value });
    Taro.showToast({
      title: '权限已更新',
      icon: 'success',
      duration: 1200
    });
  };

  const openAddForm = () => {
    setShowAddForm(true);
    setAddName('');
    setAddRelation('');
    setAddPhone('');
    setAddCanView(true);
    setAddCanEdit(false);
  };

  const closeAddForm = () => {
    setShowAddForm(false);
  };

  const handleSelectRelation = () => {
    Taro.showActionSheet({
      itemList: RELATION_LIST,
      success: (res) => {
        setAddRelation(RELATION_LIST[res.tapIndex]);
      }
    });
  };

  const handleConfirmAdd = () => {
    if (!addName.trim()) {
      Taro.showToast({ title: '请输入家属姓名', icon: 'none' });
      return;
    }
    if (!addRelation) {
      Taro.showToast({ title: '请选择家属关系', icon: 'none' });
      return;
    }
    addFamilyMember({
      name: addName.trim(),
      relation: addRelation,
      phone: addPhone || '13800000000',
      canView: addCanView,
      canEdit: addCanEdit
    });
    console.log('[FamilyPage] Added family member:', {
      name: addName,
      relation: addRelation,
      canView: addCanView,
      canEdit: addCanEdit
    });
    Taro.showToast({ title: `${addRelation}${addName}已添加`, icon: 'success' });
    closeAddForm();
  };

  const handleContact = (name: string) => {
    Taro.showActionSheet({
      itemList: ['拨打电话', '发送微信消息'],
      success: () => {
        Taro.showToast({ title: `正在联系${name}...`, icon: 'none' });
      }
    });
  };

  const handleRemove = (id: string, name: string) => {
    Taro.showModal({
      title: '确认移除',
      content: `确定要移除家属"${name}"吗？此操作不可撤销。`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          removeFamilyMember(id);
          console.log('[FamilyPage] Removed member:', { id, name });
          Taro.showToast({ title: '已移除', icon: 'success' });
        }
      }
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      {/* 共享总开关 */}
      <View className={styles.shareMasterCard}>
        <View className={styles.shareMasterInfo}>
          <Text className={styles.shareMasterTitle}>
            <Text>👨‍👩‍👧‍👦</Text>
            家属健康共享
          </Text>
          <Text className={styles.shareMasterDesc}>
            {familySharingEnabled
              ? '已开启，家属可查看您的饮食健康数据'
              : '已关闭，家属无法查看您的健康记录'}
          </Text>
        </View>
        <View className={styles.masterSwitchWrap}>
          <Switch
            checked={familySharingEnabled}
            color="#A78BFA"
            onChange={(e) => handleMasterToggle(e.detail.value)}
          />
        </View>
      </View>

      {/* 家属成员列表 */}
      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>
          <Text>👥</Text>
          家属成员
        </Text>
        <Text className={styles.sectionCount}>共 {familyMembers.length} 人</Text>
      </View>

      {familyMembers.length > 0 ? (
        <View className={styles.familyList}>
          {familyMembers.map((member) => (
            <View
              key={member.id}
              className={classnames(styles.familyCard, {
                [styles.familyCardDisabled]: !familySharingEnabled
              })}
            >
              <View className={styles.familyHeader}>
                <Image
                  className={styles.avatar}
                  src={member.avatar}
                  mode="aspectFill"
                />
                <View className={styles.familyInfo}>
                  <Text className={styles.familyName}>
                    {member.name}
                    <Text className={styles.relationBadge}>{member.relation}</Text>
                  </Text>
                  <Text className={styles.familyPhone}>{member.phone}</Text>
                </View>
              </View>

              <View className={styles.permSection}>
                <View className={styles.permRow}>
                  <View className={styles.permInfo}>
                    <Text className={styles.permIcon}>👁️</Text>
                    <View className={styles.permTextWrap}>
                      <Text className={styles.permLabel}>查看权限</Text>
                      <Text className={styles.permHint}>
                        可查看饮食记录、周报、体重趋势
                      </Text>
                    </View>
                  </View>
                  <Switch
                    checked={familySharingEnabled && member.canView}
                    disabled={!familySharingEnabled}
                    color="#10B981"
                    onChange={(e) => handlePermToggle(member.id, 'canView', e.detail.value)}
                  />
                </View>

                <View className={styles.permRow}>
                  <View className={styles.permInfo}>
                    <Text className={styles.permIcon}>✏️</Text>
                    <View className={styles.permTextWrap}>
                      <Text className={styles.permLabel}>协助编辑</Text>
                      <Text className={styles.permHint}>
                        可帮助录入记录、设置提醒（推荐给子女）
                      </Text>
                    </View>
                  </View>
                  <Switch
                    checked={familySharingEnabled && member.canEdit}
                    disabled={!familySharingEnabled}
                    color="#3B82F6"
                    onChange={(e) => handlePermToggle(member.id, 'canEdit', e.detail.value)}
                  />
                </View>
              </View>

              <View className={styles.actionRow}>
                <Button
                  className={styles.actionBtn}
                  onClick={() => handleContact(member.name)}
                >
                  <Text>📞 联系TA</Text>
                </Button>
                <Button
                  className={classnames(styles.actionBtn, styles.actionBtnDanger)}
                  onClick={() => handleRemove(member.id, member.name)}
                >
                  <Text>移除</Text>
                </Button>
              </View>
            </View>
          ))}

          {/* 添加家属按钮 */}
          <Button className={styles.addBtn} onClick={openAddForm}>
            <Text className={styles.addBtnText}>
              <Text style={{ fontSize: '36rpx' }}>＋</Text>
              添加家属成员
            </Text>
          </Button>
        </View>
      ) : (
        <View className={styles.emptyWrap}>
          <Text className={styles.emptyIcon}>🤝</Text>
          <Text className={styles.emptyTitle}>暂无家属成员</Text>
          <Text className={styles.emptyDesc}>
            添加家属后，可将您的健康数据共享给家人，让慢病管理更有温度
          </Text>
          <Button className={styles.addBtn} style={{ marginTop: '16rpx', width: '100%' }} onClick={openAddForm}>
            <Text className={styles.addBtnText}>
              <Text style={{ fontSize: '36rpx' }}>＋</Text>
              添加第一位家属
            </Text>
          </Button>
        </View>
      )}

      {/* 添加表单遮罩 */}
      {showAddForm && (
        <View className={styles.modalMask} onClick={closeAddForm}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation?.()}>
            <Text className={styles.modalTitle}>📝 添加家属成员</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>家属姓名 <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <Input
                className={styles.formInput}
                placeholder="请输入姓名"
                placeholderStyle="color: #9CA3AF"
                value={addName}
                onInput={(e) => setAddName(e.detail.value)}
                maxlength={20}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>与您的关系 <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <View
                className={classnames(styles.formInput, styles.formPicker)}
                onClick={handleSelectRelation}
              >
                <Text style={{ color: addRelation ? '#1F2937' : '#9CA3AF' }}>
                  {addRelation || '点击选择关系'}
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: '28rpx' }}>›</Text>
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>联系电话</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="请输入手机号（选填）"
                placeholderStyle="color: #9CA3AF"
                value={addPhone}
                onInput={(e) => setAddPhone(e.detail.value)}
                maxlength={11}
              />
            </View>

            <View className={styles.formPerm}>
              <View className={styles.permRow}>
                <View className={styles.permInfo}>
                  <Text className={styles.permIcon}>👁️</Text>
                  <View className={styles.permTextWrap}>
                    <Text className={styles.permLabel}>查看权限</Text>
                  </View>
                </View>
                <Switch
                  checked={addCanView}
                  color="#10B981"
                  onChange={(e) => setAddCanView(e.detail.value)}
                />
              </View>
              <View className={styles.permRow}>
                <View className={styles.permInfo}>
                  <Text className={styles.permIcon}>✏️</Text>
                  <View className={styles.permTextWrap}>
                    <Text className={styles.permLabel}>协助编辑</Text>
                  </View>
                </View>
                <Switch
                  checked={addCanEdit}
                  color="#3B82F6"
                  onChange={(e) => setAddCanEdit(e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.modalBtnCancel} onClick={closeAddForm}>
                取消
              </Button>
              <Button className={styles.modalBtnConfirm} onClick={handleConfirmAdd}>
                确认添加
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* 共享说明 */}
      <View className={styles.infoCard}>
        <Text className={styles.infoTitle}>
          <Text>🛡️</Text>
          共享内容与隐私说明
        </Text>
        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <View className={styles.infoBullet} />
            <Text className={styles.infoText}>
              <Text style={{ color: '#1F2937', fontWeight: 500 }}>可共享内容：</Text>
              饮食拍照记录、每日体重/饮水、异常症状、周报分析
            </Text>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoBullet} />
            <Text className={styles.infoText}>
              <Text style={{ color: '#1F2937', fontWeight: 500 }}>不会共享：</Text>
              个人身份信息、就诊记录、其他隐私数据
            </Text>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoBullet} />
            <Text className={styles.infoText}>
              <Text style={{ color: '#1F2937', fontWeight: 500 }}>权限控制：</Text>
              支持单独控制每位家属的查看和编辑权限，随时可关闭
            </Text>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoBullet} />
            <Text className={styles.infoText}>
              <Text style={{ color: '#1F2937', fontWeight: 500 }}>温馨提示：</Text>
              本应用不替代诊疗，出现异常请及时就医并遵医嘱
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default FamilyPage;
