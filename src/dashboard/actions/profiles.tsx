import { sendToBackground } from "@/lib/utils";
import { ActionFunctionArgs, redirect } from "react-router-dom";

export async function toggleProfileAction({ params } : ActionFunctionArgs) {
    const id = params.profileId as string;
    try {
        const res = await sendToBackground({ type: 'TOGGLE_PROFILE', id });
        return { ok : true, isEnabled: res.isEnabled };
    } catch (error) {
        return { ok : false };
    }
}

export async function deleteProfileAction({ params } : ActionFunctionArgs) {
    const id = params.profileId as string;
    console.log("Profile id ",id," to delete")
    await sendToBackground({ type: 'REMOVE_PROFILE', id });
    return redirect('/profiles');
}