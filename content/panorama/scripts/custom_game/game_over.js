var scoreboardPlayerStates = {};

function AddTableHeaders(row, cl) {
    _(arguments).chain().rest(2).each(function(header) {
        if (header) {
            var panel = $.CreatePanel("Panel", row, "");
            panel.AddClass(cl);

            var label = $.CreatePanel("Label", panel, "");
            label.AddClass("TableColumnHeaderText");
            label.text = $.Localize(header);
        }
    });
}

function AddTableCell(row, color, callback) {
    var panel = $.CreatePanel("Panel", row, "");
    panel.AddClass("TableCell");
    panel.style.backgroundColor = LuaColorA(color, 200);

    callback(panel);

    return panel;
}

function AddTextCell(row, color, text) {
    return AddTableCell(row, color, function(panel) {
        var label = $.CreatePanel("Label", panel, "");
        label.AddClass("TableCellText");
        label.text = text ? text : "None";
    })
}

function AddNumberCell(row, color, number) {
    AddTextCell(row, color, (number ? number : 0).toString()).AddClass("TableCellNumber");
}

function AddPlayerRow(scoreboard, player, stats, winner, runnerUp, mvps, rankedMode) {
    var row = $.CreatePanel("Panel", scoreboard, "");
    row.AddClass("TableRow");
    var color = player.color;

    var amountPlayed = _(stats.playedHeroes).keys().length;
    var mostPlayed = 
        _(stats.playedHeroes)
            .chain()
            .pairs()
            .max(function (arr) {
                return arr[1];
            })
            .value();

    mostPlayed =
        _(stats.playedHeroes)
            .chain()
            .pairs()
            .filter(function(arr) {
                return arr[1] == mostPlayed[1];
            })
            .value();

    var nameCell = AddTextCell(row, color, Players.GetPlayerName(player.id));
    nameCell.AddClass("TableCellString");
    nameCell.AddClass("TableNameCell");

    scoreboardPlayerStates[player.id] = $.CreatePanel("Panel", nameCell, "");
    scoreboardPlayerStates[player.id].AddClass("ConnectionStatePanel");

    if (winner || runnerUp) {
        var icon = $.CreatePanel("Panel", nameCell, "");
        var tooltip = "";
        icon.AddClass("TableIcon");

        if (winner) {
            icon.AddClass("WinnerIcon");
            tooltip = "SbWinner";
        }

        if (runnerUp) {
            icon.AddClass("RunnerUpIcon");
            tooltip = "SbRunnerUp";
        }

        icon.SetPanelEvent("onmouseover", function() {
            $.DispatchEvent("DOTAShowTextTooltip", icon, $.Localize(tooltip));
        });

        icon.SetPanelEvent("onmouseout", function() {
            $.DispatchEvent("DOTAHideTextTooltip");
        });
    }

    AddNumberCell(row, color, stats.damageDealt);
    AddNumberCell(row, color, stats.firstBloods);
    AddNumberCell(row, color, stats.kills);

    if (mvps) {
        AddNumberCell(row, color, stats.mvps);
    }
    
    AddNumberCell(row, color, stats.projectilesFired);
    AddNumberCell(row, color, amountPlayed);
    AddTableCell(row, color, function(panel) {
        var icons = $.CreatePanel("Panel", panel, "");
        icons.AddClass("TableCellIcons");

        if (mostPlayed.length <= 3) {
            _(mostPlayed).each(function(hero) {
                var img = $.CreatePanel("DOTAHeroImage", icons, "");

                img.AddClass("TableIconMini");
                img.heroimagestyle = "icon";
                img.heroname = hero[0];
            });
        } else {
            var icon = $.CreatePanel("Panel", icons, "");
            icon.AddClass("MultipleHeroesIcon");

            icon.SetPanelEvent("onmouseover", function() {
                $.DispatchEvent("DOTAShowTextTooltip", icon, $.Localize("SbTooManyHeroes"));
            });

            icon.SetPanelEvent("onmouseout", function() {
                $.DispatchEvent("DOTAHideTextTooltip");
            });
        }
    });

    if (rankedMode) {
        AddTableCell(row, color, function(panel) {
            var loading = $.CreatePanel("Panel", panel, "");
            loading.AddClass("LoadingImage");
            loading.AddClass("RankLoading")

            SubscribeToNetTableKey("ranks", "update", true, function(ranks) {
                if (!ranks) {
                    return;
                }

                loading.DeleteAsync(0);

                var previous = ranks.previous[player.id];
                var updated = ranks.updated[player.id];

                if (!updated) {
                    updated = previous;

                    if (!updated) {
                        return;
                    }
                }

                var parent = $.CreatePanel("Panel", panel, "");
                parent.AddClass("RankUpdateParent");

                CreateRankPanelSmall(parent, updated, "GameOverRank");
            });
        });
    }
}

function AddHeaders(scoreboard, mvps, rankedMode) {
    var row = $.CreatePanel("Panel", scoreboard, "");
    row.AddClass("TableRow");
    AddTableHeaders(row, "TableColumnHeaderWide", "SbName");
    AddTableHeaders(row, "TableColumnHeader", "SbDamage", "SbFirstBloods", "SbKills", mvps ? "SbMvps" : null, "SbProj", "SbAmountPlayed", "SbMostPlayed", rankedMode ? "SbRank" : null);
}

function AddFooter(scoreboard) {
    var button = $.CreatePanel("Button", scoreboard, "ExitButton");
    button.AddClass("TableFooter");

    var label = $.CreatePanel("Label", button, "");
    label.text = $.Localize("SbExit");

    button.SetPanelEvent("onactivate", function() {
        Game.FinishGame();
    });
}

function SortedTeamPlayers(players, team) {
    return _(players)
            .chain()
            .filter(function(player) { return player.team == team })
            .sortBy(function(player) { return -player.score })
            .value();
}

function GameInfoUpdated(gameInfo) {
    scoreboardPlayerStates = {};

    var scoreboard = $("#GameOverScoreboard");
    var players = gameInfo.players;
    var stats = gameInfo.statistics;

    var totalMvps = 0;

    for (var id in stats) {
        if (stats[id].mvps) {
            totalMvps += stats[id].mvps;
        }
    }

    var winners =
        _(gameInfo.runnerUps)
        .chain()
        .map(function(team) {
            return SortedTeamPlayers(players, team);
        })
        .value();

    winners.unshift.apply(winners, SortedTeamPlayers(players, gameInfo.winner));

    var playerIds = _(players).map(function(k, v) { return parseInt(v) });
    var nonWinners = _(playerIds).without.apply(_(playerIds), winners);
    nonWinners = _(nonWinners).sortBy(function(id) { return -players[id].score });
    nonWinners = _(nonWinners).map(function(id) { return players[id] });

    winners = _(winners).flatten();

    var nonWinners = _(players).filter(function(player) {
        return !_(winners).find(function(winner) {
            return winner.id == player.id
        });
    });

    winners.push.apply(winners, nonWinners); // All players combined and sorted

    AddHeaders(scoreboard, totalMvps > 0, gameInfo.rankedMode);

    _(winners).each(function(player) {
        var winner = player.team == gameInfo.winner;
        var runnerUp = _(gameInfo.runnerUps).values().indexOf(player.team) != -1;

        AddPlayerRow(scoreboard, players[player.id.toString()], stats[player.id.toString()], winner, runnerUp, totalMvps > 0, gameInfo.rankedMode);
    });

    AddFooter(scoreboard);
}

function UpdateGameOverConnectionStates() {
    $.Schedule(0.1, UpdateGameOverConnectionStates);

    for (var id in scoreboardPlayerStates) {
        var panel = scoreboardPlayerStates[id];
        var state = Game.GetPlayerInfo(parseInt(id)).player_connection_state;
        var dc = state == DOTAConnectionState_t.DOTA_CONNECTION_STATE_DISCONNECTED || state == DOTAConnectionState_t.DOTA_CONNECTION_STATE_ABANDONED

        panel.SetHasClass("ConnectionStateDisconnected", dc);
    }
}

function UpdateLabelFromRank(label, rankData) {
    if (rankData.rank == 1 && rankData.streak) {
        label.AddClass("EliteText");
        label.text = "+" + rankData.streak.current;
    } else {
        label.AddClass("NormalText");
        label.text = rankData.rank;
    }
}

function RanksUpdated(ranks) {
    if (!ranks) {
        return;
    }

    var previous = ranks.previous[Players.GetLocalPlayer()];
    var updated = ranks.updated[Players.GetLocalPlayer()];

    if (!previous || !updated) {
        return;
    }

    var lostStreak = (updated.streak && previous.streak && updated.streak.current < previous.streak.current);

    var topPanel = $("#RankUpdate");
    var rankPanel = $("#Rank");
    var newRankPanel = $("#RankNew");

    var elements = $("#RankElements");

    elements.SetHasClass("Hidden", true);

    $.Schedule(0.4, function() {
        Game.EmitSound("UI.RankAppear");
        elements.SetHasClass("Hidden", false);
        elements.RemoveClass("RankOpenAnimationClass");
        elements.AddClass("RankOpenAnimationClass");
    });

    $("#GameOverBlur").AddClass("Blurred");
    rankPanel.SetImage("file://{images}/profile_badges/level_" + (100 - previous.rank) + ".png");

    topPanel.SetHasClass("Hidden", false);
    rankPanel.SetHasClass("Hidden", false);
    
    newRankPanel.SetImage("file://{images}/profile_badges/level_" + (100 - updated.rank) + ".png");
    newRankPanel.SetHasClass("Hidden", true);

    UpdateLabelFromRank($("#RankLabel"), previous);
    UpdateLabelFromRank($("#RankLabelNew"), updated);

    $("#EliteRankText").text = "";

    $.Schedule(1.8, function() {
        rankPanel.RemoveClass("RankEndAnimationClass");
        rankPanel.AddClass("RankEndAnimationClass");
    });

    $.Schedule(2, function() {
        if (updated.rank > previous.rank || lostStreak) {
            Game.EmitSound("UI.RankDecrease");
        } else if (updated.rank > 20) {
            Game.EmitSound("UI.RankLow");
        } else if (updated.rank > 10) {
            Game.EmitSound("UI.RankMedium");
        } else {
            Game.EmitSound("UI.RankHigh");
        }
        
        newRankPanel.SetHasClass("Hidden", false);
        rankPanel.SetHasClass("Hidden", true);
        newRankPanel.RemoveClass("RankAnimationClass");
        newRankPanel.AddClass("RankAnimationClass");

        if (updated.rank <= previous.rank && !lostStreak){
            $("#RankEffect").SetHasClass("Hidden", false);
        }

        topPanel.SetPanelEvent("onactivate", function() {
            topPanel.SetHasClass("Hidden", true);
            Game.EmitSound("UI.RankClose");
            $("#GameOverBlur").RemoveClass("Blurred");
        });

        if (updated.rank == 1 && updated.streak) {
            var label = $("#EliteRankText");

            label.SetDialogVariable("max", updated.streak.max);
            label.text = $.Localize("RankStreak", label);
        }
    });
}

$.GetContextPanel().AddClass("GameOverScoreboardVisible");
$("#GameOverChat").BLoadLayout("file://{resources}/layout/custom_game/simple_chat.xml", false, false);
$("#GameOverChat").RegisterListener("GameOverEnter");

SubscribeToNetTableKey("main", "gameInfo", true, GameInfoUpdated);
SubscribeToNetTableKey("ranks", "update", true, RanksUpdated);

UpdateGameOverConnectionStates();