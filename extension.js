/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const St = imports.gi.St;

const Main = imports.ui.main;
const Workspace = imports.ui.workspace;
const WorkspacesView = imports.ui.workspacesView;

function injectToFunction(parent, name, func) {
    let origin = parent[name];
    parent[name] = function() {
        let ret;
        ret = origin.apply(this, arguments);
        if (ret === undefined)
            ret = func.apply(this, arguments);
        return ret;
    }
    return origin;
}

let workViewInjections, connectedSignals, _keyPressEventId;

function resetState() {
    workViewInjections = { };
    connectedSignals = [ ];
}

function enable() {
    resetState();

    WorkspacesView.WorkspacesView.prototype._wn_onKeyPress = function(s, o) {
        
        var symbol = o.get_key_symbol();
        let modiferState = o.get_state(o);
        let ModifierType = Clutter.ModifierType;
        if(modiferState & (ModifierType.SHIFT_MASK | ModifierType.CONTROL_MASK | ModifierType.META_MASK)) {
            return false;
        }


        const WorkspaceGrid = global.screen.workspace_grid;
        if(WorkspaceGrid){
            if(symbol == Clutter.KEY_Down)
                WorkspaceGrid.moveWorkspace(WorkspaceGrid.Directions.DOWN);
            if(symbol == Clutter.KEY_Up)
                WorkspaceGrid.moveWorkspace(WorkspaceGrid.Directions.UP);
            if(symbol == Clutter.KEY_Left)
                WorkspaceGrid.moveWorkspace(WorkspaceGrid.Directions.LEFT);
            if(symbol == Clutter.KEY_Right)
                WorkspaceGrid.moveWorkspace(WorkspaceGrid.Directions.RIGHT);
    
        }
        else{
            if(symbol == Clutter.KEY_Down || symbol == Clutter.KEY_Right || symbol == Clutter.Page_Down){
                let workspace = this._workspaces[(global.screen.get_active_workspace_index()+1)%this._workspaces.length];
                if (workspace !== undefined)
                    workspace.metaWorkspace.activate(global.get_current_time());
            }
            if(symbol == Clutter.KEY_Up || symbol == Clutter.KEY_Left || symbol == Clutter.Page_Up){
                let index = global.screen.get_active_workspace_index()-1;
                if (index < 0) index = this._workspaces.length-1;
                let workspace = this._workspaces[index];
                if (workspace !== undefined)
                    workspace.metaWorkspace.activate(global.get_current_time());
            }    
        }
        
        if (symbol == Clutter.KEY_Return){
            Main.overview.hide();
        }

        return false;
    }
    workViewInjections['_wn_onKeyPress'] = undefined;

    workViewInjections['_init'] = injectToFunction(WorkspacesView.WorkspacesView.prototype, '_init', function(width, height, x, y, workspaces) {
        if(connectedSignals.length == 0) {
            _keyPressEventId = global.stage.connect('key-press-event', Lang.bind(this, this._wn_onKeyPress));
        
            connectedSignals.push({ obj: global.stage, id: _keyPressEventId });
        }
    });

    workViewInjections['_onDestroy'] = injectToFunction(WorkspacesView.WorkspacesView.prototype, '_onDestroy', function() {
        global.stage.disconnect(_keyPressEventId);
        connectedSignals = [ ];
    });
}

function removeInjection(object, injection, name) {
    if (injection[name] === undefined)
        delete object[name];
    else
        object[name] = injection[name];
}

function disable() {
    
    for (i in workViewInjections)
        removeInjection(WorkspacesView.WorkspacesView.prototype, workViewInjections, i);

    for (i in connectedSignals)
        i.obj.disconnect(i.id);

    resetState();
}

function init() {
    /* do nothing */
}
