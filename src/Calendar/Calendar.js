/* @flow */
/* eslint no-undef: "error" */
/* eslint-env node */
import React from 'react'

import {
  View,
  StyleSheet,
  ListView,
  Image,
  StatusBar,
  AsyncStorage,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from 'react-native'

import ScalableText from 'react-native-text'
import moment from 'moment-timezone'

import api from '../Utils/api'
import ErrorPage from '../Components/ErrorPage'
import HomeHeader from '../Components/HomeHeader'

const ds = new ListView.DataSource({
  rowHasChanged: (r1, r2) => r1 !== r2
})

export default class CalendarScreen extends React.Component {
  static propTypes = {
    navigation: React.PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      isLoading: true,
      error: false,
      calendar: [],
      refreshing: false
    }
  }

  static navigationOptions = {
    drawer: () => ({
      label: 'Calendar',
    }),
  }

  _getCurrentCalendar() {
    api.getCurrentCalendar(moment().format('YYYY'))
      .then((races) => {
        const calendar = {
          raceTable: races.MRData.RaceTable.Races,
          expireTime: moment().add(1, 'd').unix()
        }

        AsyncStorage.setItem('calendar', JSON.stringify(calendar))
          .then(() => {
            this.setState({
              isLoading: false,
              refreshing: false,
              error: false,
              calendar: ds.cloneWithRows(calendar.raceTable)
            })
          })
      })
      .catch(() => {
        this.setState({
          isLoading: false,
          refreshing: false,
          error: true,
        })
      })
  }

  componentWillMount() {
    AsyncStorage.getItem('calendar')
      .then((value) => {
        if (!value) {
          this._getCurrentCalendar()
          return
        }
        const calendar = JSON.parse(value)
        if (moment().unix() > calendar.expireTime) {
          this._getCurrentCalendar()
        } else {
          this.setState({
            isLoading: false,
            calendar: ds.cloneWithRows(calendar.raceTable)
          })
        }
      })
      .catch(() => {
        this._getCurrentCalendar()
      })
  }

  render() {
    const CalendarContent = () => {
      if (this.state.isLoading) {
        return (
          <ActivityIndicator
            animating={this.state.isLoading}
            style={[styles.centering, {height: 80}]}
            size="large" />
        )
      } else if (!this.state.isLoading && this.state.calendar.length === 0 && this.state.error) {
        return ( <ErrorPage /> )
      } else {
        return (
          <View style={styles.container}>
            { this.state.calendar && this.state.calendar._cachedRowCount > 0 && this.state.error ?
              <View style={styles.errMsg}><ScalableText style={styles.errMsgTxt}>Unable to load new data!</ScalableText></View> :
              <View></View>
            }
            <ListView
              style={styles.calendar}
              refreshControl={this._refreshControl()}
              dataSource={this.state.calendar}
              renderRow={this.renderRow.bind(this)} />
          </View>
        )
      }
    }

    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={'#202930'} />
        <HomeHeader
          title="F1 Info"
          navigation={this.props.navigation} />
        <CalendarContent />
      </View>
    )
  }

  renderRow(rowData, sectionID, rowID) {
    const time = `${rowData.date}T${rowData.time}`

    const content = (
      <TouchableOpacity style={styles.row} onPress={() => console.log(this.props.navigation.navigate('CircuitScreen', {detail: rowData}))}>
        <View style={styles.dateContainer}>
          <ScalableText style={styles.dateText}>{moment(time).tz('Europe/Belgrade').format('MMM DD')}</ScalableText>
          <ScalableText style={styles.dateText}>{moment(time).tz('Europe/Belgrade').format('HH:mm')}</ScalableText>
        </View>
        <View style={styles.details}>
          <View style={styles.circle}></View>
          <View style={styles.raceContent}>
            <ScalableText style={styles.raceName}>{rowData.raceName}</ScalableText>
            <ScalableText style={styles.raceLocation}>{rowData.Circuit.Location.locality}</ScalableText>
          </View>
        </View>
      </TouchableOpacity>
    )

    if ((this.state.calendar._cachedRowCount - 1) == rowID) {
      return (
        <View>
          <Image
            style={styles.footerImg}
            source={require('../../assets/images/calendar-footer.jpg')}>
            <View style={styles.footerContent}>
              { content }
            </View>
          </Image>
        </View>
      )
    }

    return (
      <View>
        { content }
      </View>
    )
  }

  _refreshControl() {
    return (
      <RefreshControl
        refreshing={this.state.refreshing}
        onRefresh={()=>this._refreshListView()} />
    )
  }

  _refreshListView() {
    //Start Rendering Spinner
    this.setState({refreshing: true})
    this._getCurrentCalendar()
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  calendar: {
    flex: 1,
  },
  errMsg: {
    flexDirection: 'row',
    backgroundColor: '#f94057',
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
  },
  errMsgTxt: {
    fontSize: 10,
    fontFamily: 'Raleway-Medium',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    height: 50,
  },
  dateContainer: {
    width: 60,
  },
  dateText: {
    fontFamily: 'Raleway-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#f94057',
    textAlign: 'right',
  },
  details: {
    borderColor: '#f94057',
    borderLeftWidth: 1,
    flexDirection: 'column',
    flex: 1,
    marginLeft: 20,
    paddingLeft: 20,
  },
  circle: {
    opacity: Platform.OS === 'ios' ? 1 : 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#f94057',
    backgroundColor: '#fff',
    position: 'absolute',
    left: -6,
    top: 14,
  },
  raceContent: {
    flex: 1,
    justifyContent: 'center',
  },
  raceName: {
    fontFamily: 'Raleway-SemiBold',
    fontSize: 16,
    lineHeight: 20,
    color: '#444',
  },
  raceLocation: {
    fontFamily: 'Raleway-Medium',
    fontSize: 12,
    lineHeight: 12,
    color: '#819cad',
  },
  footerContent: {
    flexDirection: 'row',
    position: 'relative',
    top: 0,
    flex: 1,
    left: 0,
  },
  footerImg: {
    flex: 1,
    width: undefined,
    height: 300,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  }
})
