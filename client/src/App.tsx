import React, { Component } from 'react';
import Promise from "bluebird";
import './App.css';
import SpotifyWebApi from 'spotify-web-api-js';
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { ISpotifyCurrentSong } from "./interfaces";
import { ISongMethods, songMethods } from "./redux/modules/song";
import { format } from 'date-fns';

const spotifyApi = new SpotifyWebApi();

interface IState {
  song: ISpotifyCurrentSong;
}

interface IDispatch {
  dispatch: Dispatch<{type: 'UPDATE_SONG'}>;
}

type IProps = IState & IDispatch & ISongMethods;

class ExtendedHistory extends Component<IProps, {loggedIn: boolean, nowPlaying: { name: string, albumArt: string}, musicHistory: any }> {
  public constructor(props: IProps, {}) {
    super(props);

    // window.addEventListener("storage", this.authorizeSpotifyFromStorage);
    const hashStr = window.location.hash; // everything in address after #, here spotify puts successfull auth tokens
    // const searchStr = window.location.search; // everything in address after ?, here spotify puts access denials
    const hashParams = this.getHashParams(hashStr.slice(1, hashStr.length));
    // const searchParams = this.getHashParams(searchStr.slice(1, searchStr.length));

    // const params = this.getHashParams();
    const token = hashParams.access_token;
    if (token) {
      spotifyApi.setAccessToken(token);
    }
    this.state = {
      loggedIn: token ? true : false,
      nowPlaying: { name: 'Not Checked', albumArt: '' },
      musicHistory: []
    }

}
  songQueryLoop() {
    Promise.resolve(spotifyApi.getMyCurrentPlayingTrack())
        .then((response) => {
          // id: string;
          // song: string;
          // album: string;
          // album_art: string;
          // artist: string;
          // console.log(response);
          let currentSong = { id: response.item.id, 
                              song: response.item.name, 
                              album: response.item.album.name, 
                              album_art: response.item.album.images[0].url, 
                              artist: response.item.artists[0].name,
                              timestamp: response.timestamp};

          if (this.props.song.id !== currentSong.id) {
            return this.props.updateSong(currentSong);
          }
        return;
      })
      .delay(2000)
      .then(() => this.getHistory())
      .then(() => this.songQueryLoop());
  }

  componentDidMount() {
  const isUserAuthorized = this.state.loggedIn;

  if (isUserAuthorized) {
    spotifyApi.getMyRecentlyPlayedTracks()
      .then(data => {
        this.setState({
          musicHistory: data.items,
        });
      })
      .catch(error => console.log(error))
      .then(() => this.songQueryLoop());

      this.setState(prevState => {
        const arr = this.state.musicHistory
          .map(item => {
            const isPresent = prevState.musicHistory.find(
              e => e.played_at === item.played_at
            );
            if (isPresent === undefined) {
              return item;
            } else {
              return null;
            }
          })
          .filter(Boolean);
        return {
          musicHistory: arr.concat(prevState.musicHistory),
        };
      });
  }
}
  getHistory(){
        spotifyApi.getMyRecentlyPlayedTracks()
        .then(data => {
          // console.log(data)
          this.setState(prevState => {
            const arr = data.items
              .map(item => {
                const isPresent = prevState.musicHistory.find(
                  e => e.played_at === item.played_at
                );
                if (isPresent === undefined) {
                  return item;
                } else {
                  return null;
                }
              })
              .filter(Boolean);
            return {

              musicHistory: arr.concat(prevState.musicHistory),
            };
          });
            })
        .catch(error => console.log(error));
  }
  
  getHashParams(str: string): { [key: string]: string } {
    const hashParams: { [key: string]: string } = {};
    const a = /\+/g;  // Regex for replacing addition symbol with a space
    const r = /([^&;=]+)=?([^&;]*)/g;
    const d = (s: string) => decodeURIComponent(s.replace(a, " "));
    let e;

    while (e = r.exec(str)) {
        hashParams[d(e[1])] = d(e[2]);
    }
    return hashParams;
  }

  render() {
    const song = this.props.song;
    const musHistory = this.state.musicHistory;

    // const isLoggedIn = this.state.loggedIn;
    const RecentlyPlayed = () => (
      <div className="recently-played">
        <h2>Recent Tracks</h2>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Song title</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>{musHistory.map((e, index) => TableItem(e, index))}</tbody>
        </table>
      </div>
    );

    const TableItem = (item, index) => (
      <tr key={item.played_at}>
        <td>{index + 1}</td>
        <td>{item.track.name}</td>
        <td>{format(new Date(item.played_at), 'd MMM yyyy, hh:mma')}</td>
      </tr>
    );


    return (
      <div className="ExtendedHistory">
          <a href='http://localhost:8888' hidden={this.state.loggedIn}> Login to Spotify </a>
          <header className="header">
          <h1>What Was I listening to Again?</h1>
          <p>Extended Spotify Music History</p>

          {/* <button onClick={() => this.getHistory()}>
            Test Button
          </button> */}

          {musHistory.length !== 0 ? <RecentlyPlayed /> : null}
          </header>

        </div>
    );
  }

}


export default connect(
  (state: IState) => ({song: state.song}),
  (dispatch: Dispatch<{type: 'UPDATE_SONG'}>) => bindActionCreators(songMethods, dispatch)
)(ExtendedHistory);
