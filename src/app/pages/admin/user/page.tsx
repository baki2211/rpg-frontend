import UpdateUserPassword from '../../../components/UpdateUserPassword';
import '../admin.css';

export default function AdminUserPage() {
  return <UpdateUserPassword isAdmin={true} />;
}