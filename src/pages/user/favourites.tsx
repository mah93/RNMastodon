import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Colors from "../../config/colors";
import Screen from "../../config/screen";
import { Timelines } from "../../config/interface";
import HomeLineItem from "../home/homelineItem";
import RefreshList, { RefreshState } from "../../components/RefreshList";
import { useRequest } from "../../utils/hooks";

import { getFavouritesById } from "../../server/account";

const fetchStatusById = () => {
  const fn = (param: string) => {
    return getFavouritesById(param);
  }
  return fn;
}

interface FavouritiesProps {
  tabLabel: string;
  scrollEnabled: boolean,
  onTop: () => void,
  refreshing: boolean,
  id: string,
  onFinish: () => void,
}

const Favourities: React.FC<FavouritiesProps> = (props) => {
  const { scrollEnabled, onTop, refreshing, onFinish, id } = props;

  const { data: favourities, run: getFavourities } = useRequest(fetchStatusById(), { loading: false, manual: true }); // 获取用户发表过的推文
  const [dataSource, setDataSource] = useState<Timelines[]>([]);
  const [listStatus, setListStatus] = useState<RefreshState>(RefreshState.Idle); // 内嵌的FlatList的当前状态
  const table: any = useRef(null);
  
  useEffect(() => {
    getFavourities();
  }, []);

  useEffect(() => {
    if(refreshing) {
      getFavourities();
    }
  }, [refreshing])

  useEffect(() => {
    // 每当请求了新数据，都将下拉刷新状态设置为false
    if(favourities) {
      if (listStatus === RefreshState.Idle) {
        setDataSource(favourities);
      }
      if(listStatus === RefreshState.FooterRefreshing) {
        const maxId = dataSource[0]?.id;
        if(dataSource[0].id < maxId) {
          setDataSource(listData => listData.concat(favourities));
        }

        setListStatus(RefreshState.Idle);
      }
      // 请求结束，通知父组件完成本次刷新
      onFinish && onFinish();
    }
  }, [favourities])

  const handleListener = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    if (offsetY < 1) {
      onTop && onTop();
      // 保证table滚到最上面
      table?.current?.scrollToOffset({x: 0, y: 0, animated: true})
    }
    return null;
  }

  const handleLoadMore = useCallback(() => {
    setListStatus(status => status = RefreshState.FooterRefreshing);
    const maxId = dataSource[dataSource.length - 1]?.id;
    getFavourities(`?max_id=${maxId}`);
  }, []);

  return (
    <View 
      style={styles.main}
    >
      <RefreshList
        bounces={false}
        ref={table}
        showsVerticalScrollIndicator={false}
        style={{ flex:1, width: Screen.width }}
        data={dataSource}
        renderItem={({ item }) => <HomeLineItem item={item} />}
        scrollEnabled = {scrollEnabled}
        onScroll={handleListener}
        scrollEventThrottle={1}
        refreshState={listStatus}
        onFooterRefresh={handleLoadMore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.pageDefaultBackground,
    height: Screen.height - 154,
    width: Screen.width
  }
});

export default Favourities;
